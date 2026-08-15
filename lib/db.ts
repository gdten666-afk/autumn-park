// lib/db.ts
// Works with Turso cloud or local SQLite via @libsql/client
import { createClient, type Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'file:./data/park.db';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

// Local SQLite needs its parent directory to exist before the client opens it.
if (TURSO_URL.startsWith('file:')) {
  const dbPath = TURSO_URL.replace(/^file:/, '');
  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  } catch {
    // Directory creation failure will surface as a clear connection error later.
  }
}

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
  }
  return client;
}

// --- Compatibility wrapper: makes @libsql/client work like better-sqlite3 ---

let tablesPromise: Promise<void> | null = null;

export function ensureTables(): Promise<void> {
  if (!tablesPromise) {
    tablesPromise = doEnsureTables().catch(err => {
      tablesPromise = null; // 失败允许下次重试
      throw err;
    });
  }
  return tablesPromise;
}

async function doEnsureTables() {
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      password_hash TEXT DEFAULT '',
      role       TEXT NOT NULL DEFAULT 'user',
      invite_code TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invite_codes (
      code       TEXT PRIMARY KEY,
      used_by    TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS spaces (
      user_id    TEXT PRIMARY KEY,
      scene      TEXT NOT NULL DEFAULT 'autumn-bench',
      weather    TEXT NOT NULL DEFAULT 'sunny',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS photos (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      filename   TEXT NOT NULL,
      data       BLOB,
      caption    TEXT DEFAULT '',
      is_public  INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS weather_votes (
      user_id    TEXT NOT NULL,
      date       TEXT NOT NULL,
      vote       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, date)
    );
    CREATE TABLE IF NOT EXISTS daily_weather (
      date       TEXT PRIMARY KEY,
      weather    TEXT NOT NULL,
      set_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         TEXT PRIMARY KEY,
      content    TEXT NOT NULL,
      color      TEXT NOT NULL DEFAULT 'amber',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS photo_comments (
      id         TEXT PRIMARY KEY,
      photo_id   TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);
    CREATE INDEX IF NOT EXISTS idx_photos_public ON photos(is_public, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_photo ON photo_comments(photo_id);
  `);
  // 只对确实缺失的列执行 ALTER，避免冷启动时跨洋做多次必然失败的 DDL。
  const tableCols = async (table: string): Promise<Set<string>> => {
    const r = await db.execute(`PRAGMA table_info(${table})`);
    const names = new Set<string>();
    for (const row of r.rows) {
      const name = (row as Record<string, unknown>).name;
      if (typeof name === 'string') names.add(name);
    }
    return names;
  };
  const [userCols, photoCols] = await Promise.all([
    tableCols('users'),
    tableCols('photos'),
  ]);
  if (!userCols.has('password_hash')) {
    await db.execute(`ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT ''`);
  }
  if (!photoCols.has('data')) await db.execute(`ALTER TABLE photos ADD COLUMN data BLOB`);
  if (!photoCols.has('thumb_data')) await db.execute(`ALTER TABLE photos ADD COLUMN thumb_data BLOB`);
  if (!photoCols.has('full_key')) await db.execute(`ALTER TABLE photos ADD COLUMN full_key TEXT DEFAULT ''`);
  if (!photoCols.has('thumb_key')) await db.execute(`ALTER TABLE photos ADD COLUMN thumb_key TEXT DEFAULT ''`);
  if (!userCols.has('display_name')) {
    await db.execute(`ALTER TABLE users ADD COLUMN display_name TEXT DEFAULT ''`);
  }
  if (!userCols.has('bio')) await db.execute(`ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''`);
  const idx = await db.execute(
    `SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_users_name'`,
  );
  if (idx.rows.length === 0) {
    try { await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name ON users(name)`); } catch {}
  }
  const bootstrap = process.env.BOOTSTRAP_CODE;
  if (bootstrap) {
    await db.execute({ sql: 'INSERT OR IGNORE INTO invite_codes (code) VALUES (?)', args: [bootstrap] });
  }
}

// Convert rows to objects. libsql v0.17+ returns rows as objects already;
// older versions return rows as arrays (paired with columns).
function toObjects(result: { columns: string[]; rows: any[] }): any[] {
  if (result.rows.length === 0) return [];
  if (!Array.isArray(result.rows[0])) return result.rows;
  return result.rows.map(row => {
    const obj: any = {};
    result.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

// Direct replacement for db.prepare(sql).all(params)
export async function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  const db = getDb();
  const result = await db.execute({ sql, args: params });
  return toObjects(result as unknown as { columns: string[]; rows: any[][] });
}

// Direct replacement for db.prepare(sql).get(params)
export async function dbGet(sql: string, params: any[] = []): Promise<any | undefined> {
  const rows = await dbAll(sql, params);
  return rows[0];
}

// Direct replacement for db.prepare(sql).run(params)
export async function dbRun(sql: string, params: any[] = []): Promise<void> {
  const db = getDb();
  await db.execute({ sql, args: params });
}

// 事务性批量执行（libsql HTTP batch 在服务端同一事务内执行，失败整体回滚）
export async function dbBatch(statements: { sql: string; args?: any[] }[]): Promise<void> {
  const db = getDb();
  await db.batch(statements.map(s => ({ sql: s.sql, args: s.args ?? [] })), 'write');
}
