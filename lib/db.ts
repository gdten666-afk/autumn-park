// lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || './data/park.db';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.resolve(DB_PATH));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables(db);
  }
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
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
      used_by    TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS spaces (
      user_id    TEXT PRIMARY KEY REFERENCES users(id),
      scene      TEXT NOT NULL DEFAULT 'autumn-bench',
      weather    TEXT NOT NULL DEFAULT 'sunny',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS photos (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      filename   TEXT NOT NULL,
      caption    TEXT DEFAULT '',
      is_public  INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weather_votes (
      user_id    TEXT NOT NULL REFERENCES users(id),
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

  // Migration: add password_hash for existing databases
  try { db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT ''`); } catch {}
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
