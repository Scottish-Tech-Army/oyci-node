import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { ConflictError, NotFoundError } from '../../errors/AppError';
import { UserAccountRepository } from './userAccount.repository';
import { CreateUserDto, UpdateUserDto } from './users.schemas';

export class UsersService {
  private repo: UserAccountRepository;

  constructor(repo?: UserAccountRepository) {
    this.repo = repo ?? new UserAccountRepository();
  }

  async createUser(dto: CreateUserDto) {
    const existing = this.repo.findByEmail(dto.email);
    if (existing) throw new ConflictError(`An account with email '${dto.email}' already exists`);

    const hash = await bcrypt.hash(dto.password, config.bcryptRounds);
    const id = uuidv4();
    this.repo.create({
      id,
      email: dto.email,
      password_hash: hash,
      role_id: dto.roleId,
      is_active: 1,
      must_reset_pw: 1,
    });
    return this.repo.findById(id)!;
  }

  listUsers() {
    return this.repo.findAll();
  }

  getUser(id: string) {
    const u = this.repo.findById(id);
    if (!u) throw new NotFoundError('UserAccount', id);
    const { password_hash: _, ...safe } = u;
    return safe;
  }

  updateUser(id: string, dto: UpdateUserDto) {
    const u = this.repo.findById(id);
    if (!u) throw new NotFoundError('UserAccount', id);
    if (dto.roleId !== undefined) this.repo.updateRole(id, dto.roleId);
    if (dto.isActive !== undefined) this.repo.setActive(id, dto.isActive);
    const { password_hash: _, ...safe } = this.repo.findById(id)!;
    return safe;
  }

  async adminResetPassword(id: string, newPassword: string) {
    const u = this.repo.findById(id);
    if (!u) throw new NotFoundError('UserAccount', id);
    const hash = await bcrypt.hash(newPassword, config.bcryptRounds);
    this.repo.setPasswordHashAndRequireReset(id, hash);
  }
}
