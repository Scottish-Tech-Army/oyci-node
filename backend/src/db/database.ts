import { Database as SqliteDatabase } from 'node-sqlite3-wasm';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { ISQLiteDb, ISQLiteStatement } from './db.types';

let _db: ISQLiteDb | null = null;

function isLockedError(err: unknown): boolean {
  return err instanceof Error && /database is locked/i.test(err.message);
}

function removeStaleLockDirIfSafe(dbPath: string): void {
  const lockDir = `${dbPath}.lock`;
  if (!fs.existsSync(lockDir)) return;

  try {
    const entries = fs.readdirSync(lockDir);
    // node-sqlite3-wasm uses a lock directory. If an empty lock directory remains
    // after an unclean shutdown, it can block future startups.
    if (entries.length === 0) {
      fs.rmSync(lockDir, { recursive: true, force: true });
      console.warn(`[db] Removed stale SQLite lock directory: ${lockDir}`);
    }
  } catch (err) {
    console.warn('[db] Could not inspect/remove SQLite lock directory:', err);
  }
}

/**
 * Returns a singleton SQLite database instance.
 * The path is resolved from config so it can be overridden in tests.
 */
export function getDb(): ISQLiteDb {
  if (_db) return _db;

  const dbPath = path.resolve(config.dbFile);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  removeStaleLockDirIfSafe(dbPath);

  const rawDb = new SqliteDatabase(dbPath);

  const normalizeBindValues = (params: unknown[]): unknown => {
    if (params.length === 0) return undefined;
    if (params.length === 1) return params[0];
    return params;
  };

  const wrapStatement = (stmt: any): ISQLiteStatement => ({
    run: (...params: unknown[]) => stmt.run(normalizeBindValues(params)),
    get: (...params: unknown[]) => stmt.get(normalizeBindValues(params)),
    all: (...params: unknown[]) => stmt.all(normalizeBindValues(params)),
  });

  const dbAny = rawDb as any;
  const adapter: ISQLiteDb = {
    prepare(sql: string): ISQLiteStatement {
      return wrapStatement(dbAny.prepare(sql));
    },
    exec(sql: string): void {
      dbAny.exec(sql);
    },
    transaction<T extends (...args: any[]) => any>(fn: T): T {
      return ((...args: Parameters<T>): ReturnType<T> => {
        dbAny.exec('BEGIN');
        try {
          const result = fn(...args);
          dbAny.exec('COMMIT');
          return result;
        } catch (err) {
          try {
            dbAny.exec('ROLLBACK');
          } catch {
            // Ignore rollback failure and rethrow original error
          }
          throw err;
        }
      }) as T;
    },
    close(): void {
      dbAny.close();
    },
  };

  _db = adapter;

  // Wait briefly when the DB is contended instead of immediately failing.
  dbAny.exec('PRAGMA busy_timeout = 5000;');
  // Enable WAL mode for better concurrent read performance.
  // If another process currently holds a write lock, continue startup and keep
  // the existing journal mode rather than crashing.
  try {
    dbAny.exec('PRAGMA journal_mode = WAL;');
  } catch (err) {
    if (isLockedError(err)) {
      console.warn('[db] Database locked while enabling WAL mode. Continuing with current journal mode.');
    } else {
      throw err;
    }
  }
  // Enforce foreign key constraints
  dbAny.exec('PRAGMA foreign_keys = ON;');

  return _db;
}

/** Override the singleton — used in tests to inject an in-memory DB. */
export function setDb(db: ISQLiteDb): void {
  _db = db;
}

/** Close and clear the singleton — used in tests. */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
