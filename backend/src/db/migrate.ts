import { ISQLiteDb } from './db.types';

/**
 * Each migration is an object with an id and a set of SQL statements to run.
 * Migrations are applied in order and tracked in the _migrations table.
 * NEVER modify an existing migration — add a new one instead.
 */
interface Migration {
  id: number;
  name: string;
  up: string;
}

const migrations: Migration[] = [
  {
    id: 1,
    name: 'create_roles',
    up: `
      CREATE TABLE IF NOT EXISTS roles (
        id   TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );
      INSERT OR IGNORE INTO roles (id, name) VALUES
        ('role_admin', 'admin'),
        ('role_staff', 'staff');
    `,
  },
  {
    id: 2,
    name: 'create_user_accounts',
    up: `
      CREATE TABLE IF NOT EXISTS user_accounts (
        id             TEXT PRIMARY KEY,
        email          TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash  TEXT NOT NULL,
        role_id        TEXT NOT NULL REFERENCES roles(id),
        is_active      INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
        must_reset_pw  INTEGER NOT NULL DEFAULT 0 CHECK (must_reset_pw IN (0, 1)),
        last_login_at  TEXT,
        created_at     TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
    `,
  },
  {
    id: 3,
    name: 'create_refresh_tokens',
    up: `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
        token_hash  TEXT NOT NULL UNIQUE,
        expires_at  TEXT NOT NULL,
        revoked     INTEGER NOT NULL DEFAULT 0 CHECK (revoked IN (0, 1)),
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    `,
  },
  {
    id: 4,
    name: 'create_sessions',
    up: `
      CREATE TABLE IF NOT EXISTS sessions (
        id             TEXT PRIMARY KEY,
        title          TEXT NOT NULL,
        description    TEXT,
        start_time     DATETIME NOT NULL,
        end_time       DATETIME NOT NULL,
        location       TEXT,
        session_type   TEXT NOT NULL DEFAULT 'standard',
        notes          TEXT,
        attendees      INT,
        created_by     TEXT REFERENCES user_accounts(id),
        created_at     DATETIME NOT NULL DEFAULT (datetime('now')),
        CHECK (end_time > start_time)
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
      CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(session_type);
    `,
  },
  {
  id: 5,
  name: 'staff_allocation',
  up: `
    CREATE TABLE IF NOT EXISTS staff_allocation (
      session_id TEXT NOT NULL,
      user_id    TEXT NOT NULL,

      PRIMARY KEY (session_id, user_id),

      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)    REFERENCES user_accounts(id) ON DELETE CASCADE
    );

    -- only needed if you query by user_id alone
    CREATE INDEX IF NOT EXISTS idx_staff_allocation_user
      ON staff_allocation(user_id);
  `,
  },
  {
    id: 6,
    name: 'staff_skills',
    up: `
      CREATE TABLE IF NOT EXISTS staff_skills (
        user_id      TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
        session_type TEXT NOT NULL,
        PRIMARY KEY (user_id, session_type)
      );
      CREATE INDEX IF NOT EXISTS idx_staff_skills_session_type ON staff_skills(session_type);
    `,
  },
  {
    id: 7,
    name: 'staff_availability',
    up: `
      CREATE TABLE IF NOT EXISTS staff_availability (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
        start_time DATETIME NOT NULL,
        end_time   DATETIME NOT NULL,
        leave_type TEXT NOT NULL CHECK (leave_type IN ('leave', 'busy')),
        CHECK (end_time > start_time)
      );
      CREATE INDEX IF NOT EXISTS idx_staff_availability_user ON staff_availability(user_id);
      CREATE INDEX IF NOT EXISTS idx_staff_availability_time ON staff_availability(start_time, end_time);
    `,
  },
  {
    id: 8,
    name: 'staff_availability_leave_details',
    up: `
      ALTER TABLE staff_availability ADD COLUMN display_leave_type TEXT NOT NULL DEFAULT 'away' CHECK (display_leave_type IN ('away', 'sick'));
      ALTER TABLE staff_availability ADD COLUMN notes TEXT;
    `,
  },
  {
    id: 9,
    name: 'create_staff_profiles',
    up: `
      CREATE TABLE IF NOT EXISTS staff_profiles (
        user_id TEXT PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        contract_type TEXT NOT NULL DEFAULT 'salaried' CHECK (contract_type IN ('salaried', 'sessional')),
        contracted_hours_per_week REAL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_staff_profiles_name ON staff_profiles(last_name, first_name);
    `,
  },
];

export function runMigrations(db: ISQLiteDb): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = db
    .prepare('SELECT id FROM _migrations')
    .all()
    .map((r: any) => r.id as number);

  const pending = migrations.filter(m => !applied.includes(m.id));

  if (pending.length === 0) {
    console.log('[migrations] All migrations already applied.');
    return;
  }

  const applyMigration = db.transaction((m: Migration) => {
    db.exec(m.up);
    db.prepare('INSERT INTO _migrations (id, name) VALUES (?, ?)')
      .run(m.id, m.name);
    console.log(`[migrations] Applied migration ${m.id}: ${m.name}`);
  });

  for (const m of pending) {
    applyMigration(m);
  }
}
