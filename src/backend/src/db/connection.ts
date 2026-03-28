import BetterSqlite3 from "better-sqlite3";
import path from "path";
import fs from "fs";
import { config } from "../config";

// ---------------------------------------------------------------------------
// Async-style wrapper around better-sqlite3
// ---------------------------------------------------------------------------
// better-sqlite3 is synchronous under the hood (fine for a local SQLite file)
// but we expose a Promise-based API so the rest of the codebase uses
// async/await uniformly and we can swap drivers later if needed.
// ---------------------------------------------------------------------------

export interface DbRow {
  [key: string]: unknown;
}

export class Database {
  private db: BetterSqlite3.Database;

  constructor(db: BetterSqlite3.Database) {
    this.db = db;
  }

  /** Execute INSERT / UPDATE / DELETE / CREATE — returns run metadata */
  run(sql: string, params: unknown[] = []): Promise<BetterSqlite3.RunResult> {
    return Promise.resolve(this.db.prepare(sql).run(params));
  }

  /** Fetch a single matching row, or undefined */
  get<T extends DbRow>(
    sql: string,
    params: unknown[] = []
  ): Promise<T | undefined> {
    return Promise.resolve(
      this.db.prepare(sql).get(params) as T | undefined
    );
  }

  /** Fetch all matching rows */
  all<T extends DbRow>(
    sql: string,
    params: unknown[] = []
  ): Promise<T[]> {
    return Promise.resolve(
      this.db.prepare(sql).all(params) as T[]
    );
  }

  /** Execute raw SQL — used for schema setup (multiple statements) */
  exec(sql: string): Promise<void> {
    this.db.exec(sql);
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.db.close();
    return Promise.resolve();
  }

  /** Expose raw driver for transactions later */
  raw(): BetterSqlite3.Database {
    return this.db;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let instance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (instance) return instance;

  // Ensure the data/ directory exists
  const dir = path.dirname(config.db.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const raw = new BetterSqlite3(config.db.path, {
    verbose: config.isDev
      ? (msg) => console.log("[sql]", msg)
      : undefined,
  });

  // Performance + correctness PRAGMAs
  raw.pragma("journal_mode = WAL");    // better concurrent reads
  raw.pragma("foreign_keys = ON");     // enforce FK constraints
  raw.pragma("synchronous = NORMAL");  // safe with WAL

  instance = new Database(raw);
  console.log(`[db] Connected → ${config.db.path}`);
  return instance;
}

export async function closeDb(): Promise<void> {
  if (instance) {
    await instance.close();
    instance = null;
    console.log("[db] Connection closed");
  }
}