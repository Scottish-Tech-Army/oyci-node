import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { AuthenticationError, BusinessRuleError } from '../../errors/AppError';
import { UserAccountRepository } from '../users/userAccount.repository';
import { AuthTokenPayload, Role } from '../../types/auth.types';

export interface LoginResult {
  accessToken: string;
  user: { id: string; email: string; role: Role };
}

export class AuthService {
  private repo: UserAccountRepository;

  constructor(repo?: UserAccountRepository) {
    this.repo = repo ?? new UserAccountRepository();
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const account = this.repo.findByEmail(email);

    // Always compare even if user not found to prevent timing attacks
    const dummyHash = '$2b$12$invalid.hash.for.timing.purposes.only.padding';
    const hash = account?.password_hash ?? dummyHash;
    const valid = await bcrypt.compare(password, hash);

    if (!account || !valid) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!account.is_active) {
      throw new AuthenticationError('Account is deactivated. Please contact an administrator.');
    }

    this.repo.updateLastLogin(account.id);

    const role = account.role_id === 'role_admin' ? 'admin' : 'staff' as Role;
    const payload: AuthTokenPayload = { sub: account.id, email: account.email, role };
    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
      jwtid: uuidv4(),
    });

    return { accessToken, user: { id: account.id, email: account.email, role } };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const account = this.repo.findById(userId);
    if (!account) throw new AuthenticationError();

    const valid = await bcrypt.compare(currentPassword, account.password_hash);
    if (!valid) throw new AuthenticationError('Current password is incorrect');

    if (newPassword.length < 10) {
      throw new BusinessRuleError('New password must be at least 10 characters', 'PASSWORD_TOO_SHORT');
    }

    const hash = await bcrypt.hash(newPassword, config.bcryptRounds);
    this.repo.setPasswordHash(userId, hash);
  }
}
