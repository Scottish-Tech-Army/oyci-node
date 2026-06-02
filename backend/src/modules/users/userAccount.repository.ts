import { ISQLiteDb } from '../../db/db.types';
import { getDb } from '../../db/database';

export interface UserAccountRow {
  id: string;
  email: string;
  password_hash: string;
  role_id: string;
  is_active: number;
  must_reset_pw: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Data access for user_accounts — keep this the only place SQL touches user_accounts directly. */
export class UserAccountRepository {
  private db: ISQLiteDb;

  constructor(db?: ISQLiteDb) {
    this.db = db ?? getDb();
  }

  findById(id: string): UserAccountRow | null {
    return (this.db.prepare('SELECT * FROM user_accounts WHERE id = ?').get(id) as UserAccountRow) ?? null;
  }

  findByEmail(email: string): UserAccountRow | null {
    return (this.db.prepare('SELECT * FROM user_accounts WHERE email = ? COLLATE NOCASE').get(email) as UserAccountRow) ?? null;
  }

  updateLastLogin(id: string): void {
    this.db.prepare(`UPDATE user_accounts SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(id);
  }

  create(row: Omit<UserAccountRow, 'last_login_at' | 'created_at' | 'updated_at'>): void {
    this.db.prepare(`
      INSERT INTO user_accounts (id, email, password_hash, role_id, is_active, must_reset_pw)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(row.id, row.email, row.password_hash, row.role_id, row.is_active, row.must_reset_pw);
  }

  setActive(id: string, active: boolean): void {
    this.db.prepare(`UPDATE user_accounts SET is_active = ?, updated_at = datetime('now') WHERE id = ?`).run(active ? 1 : 0, id);
  }

  setPasswordHash(id: string, hash: string): void {
    this.db.prepare(`UPDATE user_accounts SET password_hash = ?, must_reset_pw = 0, updated_at = datetime('now') WHERE id = ?`).run(hash, id);
  }

  setPasswordHashAndRequireReset(id: string, hash: string): void {
    this.db.prepare(`UPDATE user_accounts SET password_hash = ?, must_reset_pw = 1, updated_at = datetime('now') WHERE id = ?`).run(hash, id);
  }

  updateRole(id: string, roleId: string): void {
    this.db.prepare(`UPDATE user_accounts SET role_id = ?, updated_at = datetime('now') WHERE id = ?`).run(roleId, id);
  }

  findAll(): Omit<UserAccountRow, 'password_hash'>[] {
    return this.db.prepare('SELECT id, email, role_id, is_active, must_reset_pw, last_login_at, created_at, updated_at FROM user_accounts').all() as Omit<UserAccountRow, 'password_hash'>[];
  }
}
