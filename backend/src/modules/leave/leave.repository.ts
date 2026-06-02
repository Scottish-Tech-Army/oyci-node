import { getDb } from '../../db/database';
import { ISQLiteDb } from '../../db/db.types';

export interface LeaveAvailabilityRow {
  id: string;
  user_id: string;
  user_email: string;
  start_time: string;
  end_time: string;
  leave_type: 'leave' | 'busy' | 'available';
  display_leave_type: 'away' | 'sick';
  notes: string | null;
}

export interface LeaveAvailabilityInsertRow {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  leave_type: 'leave';
  display_leave_type: 'away' | 'sick';
  notes: string | null;
}

export class LeaveRepository {
  private db: ISQLiteDb;

  constructor(db?: ISQLiteDb) {
    this.db = db ?? getDb();
  }

  findAll(filters: { from?: string; to?: string } = {}): LeaveAvailabilityRow[] {
    let sql = `
      SELECT
        sa.id,
        sa.user_id,
        u.email AS user_email,
        sa.start_time,
        sa.end_time,
        sa.leave_type,
        COALESCE(sa.display_leave_type, 'away') AS display_leave_type,
        sa.notes
      FROM staff_availability sa
      JOIN user_accounts u ON u.id = sa.user_id
      WHERE sa.leave_type = 'leave'
    `;
    const params: unknown[] = [];

    if (filters.from) {
      sql += ` AND date(sa.end_time, '-1 day') >= date(?)`;
      params.push(filters.from);
    }

    if (filters.to) {
      sql += ` AND date(sa.start_time) <= date(?)`;
      params.push(filters.to);
    }

    sql += ' ORDER BY sa.start_time, u.email';
    return this.db.prepare(sql).all(...params) as LeaveAvailabilityRow[];
  }

  findById(id: string): LeaveAvailabilityRow | null {
    return (this.db.prepare(`
      SELECT
        sa.id,
        sa.user_id,
        u.email AS user_email,
        sa.start_time,
        sa.end_time,
        sa.leave_type,
        COALESCE(sa.display_leave_type, 'away') AS display_leave_type,
        sa.notes
      FROM staff_availability sa
      JOIN user_accounts u ON u.id = sa.user_id
      WHERE sa.id = ?
    `).get(id) as LeaveAvailabilityRow) ?? null;
  }

  create(row: LeaveAvailabilityInsertRow): void {
    this.db.prepare(`
      INSERT INTO staff_availability (id, user_id, start_time, end_time, leave_type, display_leave_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.id,
      row.user_id,
      row.start_time,
      row.end_time,
      row.leave_type,
      row.display_leave_type,
      row.notes,
    );
  }

  update(id: string, fields: Partial<Omit<LeaveAvailabilityInsertRow, 'id' | 'user_id'>>): void {
    const sets = Object.keys(fields).map((key) => `${key} = ?`).join(', ');
    this.db.prepare(`UPDATE staff_availability SET ${sets} WHERE id = ?`).run(...Object.values(fields), id);
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM staff_availability WHERE id = ?').run(id);
  }
}