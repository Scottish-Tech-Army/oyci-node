import { ISQLiteDb } from '../../db/db.types';
import { getDb } from '../../db/database';

export interface SessionRow {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  session_type: string;
  notes: string | null;
  attendees: number | null;
  created_by: string | null;
  created_at: string;
}

export interface EligibleStaffRow {
  id: string;
  email: string;
}

export interface SessionAssignedStaffRow {
  session_id: string;
  email: string;
}

export interface SessionAssignedStaffUserRow {
  id: string;
  email: string;
}

export class SessionsRepository {
  private db: ISQLiteDb;
  constructor(db?: ISQLiteDb) { this.db = db ?? getDb(); }

  findAll(filters: { sessionType?: string; from?: string; to?: string } = {}): SessionRow[] {
    let sql = 'SELECT * FROM sessions WHERE 1=1';
    const params: unknown[] = [];
    if (filters.sessionType) { sql += ' AND session_type = ?'; params.push(filters.sessionType); }
    if (filters.from)        { sql += " AND date(start_time) >= date(?)"; params.push(filters.from); }
    if (filters.to)          { sql += " AND date(start_time) <= date(?)"; params.push(filters.to); }
    sql += ' ORDER BY start_time';
    return this.db.prepare(sql).all(...params) as SessionRow[];
  }

  findById(id: string): SessionRow | null {
    return (this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow) ?? null;
  }

  create(row: Omit<SessionRow, 'created_at'>): void {
    this.db.prepare(`
      INSERT INTO sessions
        (id, title, description, start_time, end_time, location, session_type, notes, attendees, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.id, row.title, row.description,
      row.start_time, row.end_time, row.location,
      row.session_type, row.notes, row.attendees, row.created_by,
    );
  }

  update(id: string, fields: Partial<Omit<SessionRow, 'id' | 'created_at'>>): void {
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    this.db.prepare(`UPDATE sessions SET ${sets} WHERE id = ?`).run(...Object.values(fields), id);
  }

  findEligibleStaff(startTime: string | undefined, endTime: string | undefined, sessionType: string): EligibleStaffRow[] {
    let sql = `
      SELECT u.id, u.email
      FROM user_accounts u
      WHERE u.is_active = 1
        AND (
          ? = 'standard'
          OR EXISTS (
            SELECT 1
            FROM staff_skills ss
            WHERE ss.user_id = u.id
              AND ss.session_type = ?
          )
        )
    `;
    const params: Array<string> = [sessionType, sessionType];

    if (startTime && endTime) {
      sql += `
        AND NOT EXISTS (
          SELECT 1
          FROM staff_availability sa
          WHERE sa.user_id = u.id
            AND sa.start_time < ?
            AND sa.end_time > ?
        )
      `;
      params.push(endTime, startTime);
    }

    sql += ' ORDER BY u.email';
    return this.db.prepare(sql).all(...params) as EligibleStaffRow[];
  }

  createStaffAllocations(sessionId: string, userIds: string[]): void {
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO staff_allocation (session_id, user_id)
      VALUES (?, ?)
    `);

    this.db.transaction(() => {
      for (const userId of userIds) {
        insert.run(sessionId, userId);
      }
    })();
  }

  replaceStaffAllocations(sessionId: string, userIds: string[]): void {
    const deleteExisting = this.db.prepare(`
      DELETE FROM staff_allocation
      WHERE session_id = ?
    `);
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO staff_allocation (session_id, user_id)
      VALUES (?, ?)
    `);
    const uniqueUserIds = [...new Set(userIds)];

    this.db.transaction(() => {
      deleteExisting.run(sessionId);
      for (const userId of uniqueUserIds) {
        insert.run(sessionId, userId);
      }
    })();
  }

  findAssignedStaffBySessionIds(sessionIds: string[]): SessionAssignedStaffRow[] {
    if (sessionIds.length === 0) return [];
    const placeholders = sessionIds.map(() => '?').join(', ');
    return this.db.prepare(`
      SELECT sa.session_id, u.email
      FROM staff_allocation sa
      JOIN user_accounts u ON u.id = sa.user_id
      WHERE sa.session_id IN (${placeholders})
      ORDER BY u.email
    `).all(...sessionIds) as SessionAssignedStaffRow[];
  }

  findAssignedStaffBySessionId(sessionId: string): string[] {
    return this.db.prepare(`
      SELECT u.email
      FROM staff_allocation sa
      JOIN user_accounts u ON u.id = sa.user_id
      WHERE sa.session_id = ?
      ORDER BY u.email
    `).all(sessionId).map((row: any) => row.email as string);
  }

  findAssignedStaffUsersBySessionId(sessionId: string): SessionAssignedStaffUserRow[] {
    return this.db.prepare(`
      SELECT u.id, u.email
      FROM staff_allocation sa
      JOIN user_accounts u ON u.id = sa.user_id
      WHERE sa.session_id = ?
      ORDER BY u.email
    `).all(sessionId) as SessionAssignedStaffUserRow[];
  }

}
