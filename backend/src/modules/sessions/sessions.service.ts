import { v4 as uuidv4 } from 'uuid';
import { BusinessRuleError } from '../../errors/AppError';
import { NotFoundError } from '../../errors/AppError';
import { AuthenticationError } from '../../errors/AppError';
import { SessionsRepository } from './sessions.repository';
import { CreateSessionDto, UpdateSessionDto } from './sessions.schemas';
import { UserAccountRepository } from '../users/userAccount.repository';

export class SessionsService {
  private repo: SessionsRepository;
  private usersRepo: UserAccountRepository;
  constructor(repo?: SessionsRepository, usersRepo?: UserAccountRepository) {
    this.repo = repo ?? new SessionsRepository();
    this.usersRepo = usersRepo ?? new UserAccountRepository();
  }

  private assertEligibleStaffSelection(
    staffUserIds: string[],
    startTime: string,
    endTime: string,
    sessionType: string,
  ) {
    if (staffUserIds.length === 0) {
      return;
    }

    const eligible = this.repo.findEligibleStaff(startTime, endTime, sessionType);
    const eligibleIds = new Set(eligible.map((staff) => staff.id));
    const invalidSelections = [...new Set(staffUserIds)].filter((userId) => !eligibleIds.has(userId));

    if (invalidSelections.length > 0) {
      throw new BusinessRuleError('One or more selected staff are not eligible for this session', 'STAFF_NOT_ELIGIBLE');
    }
  }

  list(filters: { sessionType?: string; from?: string; to?: string }) {
    const sessions = this.repo.findAll(filters);
    const assignedRows = this.repo.findAssignedStaffBySessionIds(sessions.map((session) => session.id));
    const assignedMap = new Map<string, string[]>();

    for (const row of assignedRows) {
      const existing = assignedMap.get(row.session_id) ?? [];
      existing.push(row.email);
      assignedMap.set(row.session_id, existing);
    }

    return sessions.map((session) => ({
      ...session,
      staffAssigned: assignedMap.get(session.id) ?? [],
    }));
  }

  get(id: string) {
    const s = this.repo.findById(id);
    if (!s) throw new NotFoundError('Session', id);
    const assignedStaffUsers = this.repo.findAssignedStaffUsersBySessionId(id);
    return {
      ...s,
      staffAssigned: assignedStaffUsers.map((staff) => staff.email),
      assignedStaffUsers,
    };
  }

  listEligibleStaff(startTime: string | undefined, endTime: string | undefined, sessionType: string) {
    return this.repo.findEligibleStaff(startTime, endTime, sessionType);
  }

  create(dto: CreateSessionDto, actorId: string) {
    if (!this.usersRepo.findById(actorId)) {
      throw new AuthenticationError('Authenticated user no longer exists. Please sign in again.');
    }

    const id = uuidv4();
    const sessionType = dto.sessionType ?? 'standard';

    if (dto.staffUserIds && dto.staffUserIds.length > 0) {
      this.assertEligibleStaffSelection(dto.staffUserIds, dto.startTime, dto.endTime, sessionType);
    }

    this.repo.create({
      id,
      title: dto.title,
      description: dto.description ?? null,
      start_time: dto.startTime,
      end_time: dto.endTime,
      location: dto.location ?? null,
      session_type: sessionType,
      notes: dto.notes ?? null,
      attendees: dto.attendees ?? null,
      created_by: actorId,
    });

    if (dto.staffUserIds && dto.staffUserIds.length > 0) {
      this.repo.createStaffAllocations(id, dto.staffUserIds);
    }

    return this.get(id);
  }

  update(id: string, dto: UpdateSessionDto) {
    const existing = this.repo.findById(id);
    if (!existing) throw new NotFoundError('Session', id);

    const fields = Object.fromEntries(
      Object.entries({
        title: dto.title,
        description: dto.description,
        start_time: dto.startTime,
        end_time: dto.endTime,
        location: dto.location,
        session_type: dto.sessionType,
        notes: dto.notes,
        attendees: dto.attendees,
      }).filter(([, value]) => value !== undefined),
    );

    if (dto.staffUserIds !== undefined) {
      const nextStartTime = dto.startTime ?? existing.start_time;
      const nextEndTime = dto.endTime ?? existing.end_time;
      const nextSessionType = dto.sessionType ?? existing.session_type;

      this.assertEligibleStaffSelection(dto.staffUserIds, nextStartTime, nextEndTime, nextSessionType);
    }

    if (Object.keys(fields).length > 0) {
      this.repo.update(id, fields);
    }

    if (dto.staffUserIds !== undefined) {
      this.repo.replaceStaffAllocations(id, dto.staffUserIds);
    }

    return this.get(id);
  }
}
