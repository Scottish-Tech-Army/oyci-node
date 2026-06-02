import { getDb } from '../../db/database';
import { ISQLiteDb } from '../../db/db.types';

export interface StaffMemberRow {
  id: string;
  email: string;
  role_id: string;
  is_active: number;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  contract_type: string | null;
  contracted_hours_per_week: number | null;
  notes: string | null;
}

type CreateProfileInput = {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  contractType: string;
  contractedHoursPerWeek?: number | null;
  notes?: string | null;
};

type UpdateProfileFields = Partial<{
  first_name: string;
  last_name: string;
  phone: string | null;
  contract_type: string;
  contracted_hours_per_week: number | null;
  notes: string | null;
}>;

export class StaffRepository {
  private db: ISQLiteDb;

  constructor(db?: ISQLiteDb) {
    this.db = db ?? getDb();
  }

  findAll(): StaffMemberRow[] {
    return this.db.prepare(`
      SELECT
        u.id,
        u.email,
        u.role_id,
        u.is_active,
        u.created_at,
        sp.first_name,
        sp.last_name,
        sp.phone,
        sp.contract_type,
        sp.contracted_hours_per_week,
        sp.notes
      FROM user_accounts u
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE u.role_id = 'role_staff'
      ORDER BY sp.last_name, sp.first_name, u.email
    `).all() as StaffMemberRow[];
  }

  findById(id: string): StaffMemberRow | null {
    return (this.db.prepare(`
      SELECT
        u.id,
        u.email,
        u.role_id,
        u.is_active,
        u.created_at,
        sp.first_name,
        sp.last_name,
        sp.phone,
        sp.contract_type,
        sp.contracted_hours_per_week,
        sp.notes
      FROM user_accounts u
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE u.role_id = 'role_staff' AND u.id = ?
    `).get(id) as StaffMemberRow) ?? null;
  }

  createProfile(data: CreateProfileInput): void {
    this.db.prepare(`
      INSERT INTO staff_profiles (
        user_id,
        first_name,
        last_name,
        phone,
        contract_type,
        contracted_hours_per_week,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.userId,
      data.firstName,
      data.lastName,
      data.phone ?? null,
      data.contractType,
      data.contractedHoursPerWeek ?? null,
      data.notes ?? null,
    );
  }

  updateProfile(userId: string, fields: UpdateProfileFields): void {
    const entries = Object.entries(fields);
    if (entries.length === 0) {
      return;
    }

    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([, value]) => value);

    this.db.prepare(`
      UPDATE staff_profiles
      SET ${setClause}, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(...values, userId);
  }

  setSkills(userId: string, sessionTypes: string[]): void {
    const applySkills = this.db.transaction((targetUserId: string, types: string[]) => {
      this.db.prepare('DELETE FROM staff_skills WHERE user_id = ?').run(targetUserId);

      const insertSkill = this.db.prepare(`
        INSERT INTO staff_skills (user_id, session_type)
        VALUES (?, ?)
      `);

      for (const sessionType of types) {
        insertSkill.run(targetUserId, sessionType);
      }
    });

    applySkills(userId, sessionTypes);
  }

  getSkills(userId: string): string[] {
    return this.db.prepare('SELECT session_type FROM staff_skills WHERE user_id = ? ORDER BY session_type').all(userId)
      .map((row) => (row as { session_type: string }).session_type);
  }
}
