import { v4 as uuidv4 } from 'uuid';
import { BusinessRuleError, ForbiddenError, NotFoundError } from '../../errors/AppError';
import { LeaveAvailabilityInsertRow, LeaveAvailabilityRow, LeaveRepository } from './leave.repository';
import { CreateLeaveDto, ListLeaveQuery, UpdateLeaveDto } from './leave.schemas';

type UserRole = 'admin' | 'staff';

function parseDateParts(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

function toStartOfDayIso(value: string): string {
  const { year, month, day } = parseDateParts(value);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
}

function addDays(value: string, amount: number): string {
  const { year, month, day } = parseDateParts(value);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function fromStoredStartDate(value: string): string {
  return value.slice(0, 10);
}

function fromStoredEndDate(value: string): string {
  return addDays(value.slice(0, 10), -1);
}

function toLeaveRecord(row: LeaveAvailabilityRow) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_email,
    startDate: fromStoredStartDate(row.start_time),
    endDate: fromStoredEndDate(row.end_time),
    leaveType: row.display_leave_type,
    availabilityType: row.leave_type,
    notes: row.notes ?? null,
  };
}

export class LeaveService {
  private repo: LeaveRepository;

  constructor(repo?: LeaveRepository) {
    this.repo = repo ?? new LeaveRepository();
  }

  list(query: ListLeaveQuery = {}) {
    return this.repo.findAll(query).map(toLeaveRecord);
  }

  get(id: string) {
    const row = this.repo.findById(id);
    if (!row) {
      throw new NotFoundError('Leave entry', id);
    }

    return toLeaveRecord(row);
  }

  create(dto: CreateLeaveDto, actorId: string) {
    if (Date.parse(dto.endDate) < Date.parse(dto.startDate)) {
      throw new BusinessRuleError('endDate must be on or after startDate', 'INVALID_LEAVE_RANGE');
    }

    const id = uuidv4();
    this.repo.create({
      id,
      user_id: actorId,
      start_time: toStartOfDayIso(dto.startDate),
      end_time: toStartOfDayIso(addDays(dto.endDate, 1)),
      leave_type: 'leave',
      display_leave_type: dto.leaveType,
      notes: dto.notes ?? null,
    });

    return this.get(id);
  }

  update(id: string, dto: UpdateLeaveDto, actorId: string, role: UserRole) {
    const current = this.repo.findById(id);
    if (!current) {
      throw new NotFoundError('Leave entry', id);
    }

    if (role !== 'admin' && current.user_id !== actorId) {
      throw new ForbiddenError('You can only update your own leave.');
    }

    const nextStartDate = dto.startDate ?? fromStoredStartDate(current.start_time);
    const nextEndDate = dto.endDate ?? fromStoredEndDate(current.end_time);

    if (Date.parse(nextEndDate) < Date.parse(nextStartDate)) {
      throw new BusinessRuleError('endDate must be on or after startDate', 'INVALID_LEAVE_RANGE');
    }

    const fields: Partial<Omit<LeaveAvailabilityInsertRow, 'id' | 'user_id'>> = {
      start_time: toStartOfDayIso(nextStartDate),
      end_time: toStartOfDayIso(addDays(nextEndDate, 1)),
      leave_type: 'leave',
    };

    if (dto.leaveType !== undefined) {
      fields.display_leave_type = dto.leaveType;
    }

    if (dto.notes !== undefined) {
      fields.notes = dto.notes ?? null;
    }

    this.repo.update(id, fields);
    return this.get(id);
  }

  delete(id: string, actorId: string, role: UserRole) {
    const current = this.repo.findById(id);
    if (!current) {
      throw new NotFoundError('Leave entry', id);
    }

    if (role !== 'admin' && current.user_id !== actorId) {
      throw new ForbiddenError('You can only delete your own leave.');
    }

    this.repo.delete(id);
  }
}