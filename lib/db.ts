// lib/db.ts
// Works with Turso cloud or local SQLite via @libsql/client
import { createClient, type Client } from '@libsql/client';

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'file:./data/park.db';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

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

let tablesReady = false;

export async function ensureTables() {
  if (tablesReady) return;
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
  `);
  try { await db.execute(`ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT ''`); } catch {}
  const bootstrap = process.env.BOOTSTRAP_CODE;
  if (bootstrap) {
    await db.execute({ sql: 'INSERT OR IGNORE INTO invite_codes (code) VALUES (?)', args: [bootstrap] });
  }
  tablesReady = true;
}

// Convert rows array + columns array → array of objects
function toObjects(result: { columns: string[]; rows: any[][] }): any[] {
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
