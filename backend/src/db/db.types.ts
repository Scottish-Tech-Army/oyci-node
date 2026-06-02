/**
 * Minimal interface over the synchronous SQLite APIs used by this application.
 * Both better-sqlite3 and node-sqlite3-wasm satisfy this interface, which keeps
 * all repository and migration code decoupled from the concrete library.
 */

export interface ISQLiteStatement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export interface ISQLiteDb {
  prepare(sql: string): ISQLiteStatement;
  exec(sql: string): void;
  transaction<T extends (...args: any[]) => any>(fn: T): T;
  close(): void;
}
