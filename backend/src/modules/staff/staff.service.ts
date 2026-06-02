import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { ConflictError, NotFoundError } from '../../errors/AppError';
import { UserAccountRepository } from '../users/userAccount.repository';
import { StaffRepository } from './staff.repository';
import { CreateStaffDto, UpdateStaffDto } from './staff.schemas';

export class StaffService {
  private staffRepo: StaffRepository;
  private userRepo: UserAccountRepository;

  constructor() {
    this.staffRepo = new StaffRepository();
    this.userRepo = new UserAccountRepository();
  }

  listStaff() {
    const members = this.staffRepo.findAll();
    return members.map(m => ({
      ...m,
      skills: this.staffRepo.getSkills(m.id),
    }));
  }

  getStaffMember(id: string) {
    const m = this.staffRepo.findById(id);
    if (!m) throw new NotFoundError('StaffMember', id);
    return { ...m, skills: this.staffRepo.getSkills(id) };
  }

  async createStaffMember(dto: CreateStaffDto) {
    const existing = this.userRepo.findByEmail(dto.email);
    if (existing) throw new ConflictError(`An account with email '${dto.email}' already exists`);

    const hash = await bcrypt.hash(dto.password, config.bcryptRounds);
    const userId = uuidv4();

    this.userRepo.create({
      id: userId,
      email: dto.email,
      password_hash: hash,
      role_id: 'role_staff',
      is_active: 1,
      must_reset_pw: 1,
    });

    this.staffRepo.createProfile({
      userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      contractType: dto.contractType,
      contractedHoursPerWeek: dto.contractedHoursPerWeek ?? null,
      notes: dto.notes ?? null,
    });

    if (dto.skills && dto.skills.length > 0) {
      this.staffRepo.setSkills(userId, dto.skills);
    }

    return this.getStaffMember(userId);
  }

  updateStaffMember(id: string, dto: UpdateStaffDto) {
    const m = this.staffRepo.findById(id);
    if (!m) throw new NotFoundError('StaffMember', id);

    const profileFields: Record<string, unknown> = {};
    if (dto.firstName !== undefined) profileFields.first_name = dto.firstName;
    if (dto.lastName !== undefined) profileFields.last_name = dto.lastName;
    if (dto.phone !== undefined) profileFields.phone = dto.phone;
    if (dto.contractType !== undefined) profileFields.contract_type = dto.contractType;
    if (dto.contractedHoursPerWeek !== undefined) profileFields.contracted_hours_per_week = dto.contractedHoursPerWeek;
    if (dto.notes !== undefined) profileFields.notes = dto.notes;

    if (Object.keys(profileFields).length > 0) {
      this.staffRepo.updateProfile(id, profileFields);
    }

    if (dto.isActive !== undefined) {
      this.userRepo.setActive(id, dto.isActive);
    }

    if (dto.skills !== undefined) {
      this.staffRepo.setSkills(id, dto.skills);
    }

    return this.getStaffMember(id);
  }
}
