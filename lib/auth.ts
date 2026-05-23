// lib/auth.ts
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { dbGet } from './db';
import type { UserSession } from './types';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const attempt = crypto.scryptSync(password, salt, 64).toString('hex');
  return attempt === hash;
}

const SESSION_COOKIE = 'park_session';

export async function createSession(user: { id: string; name: string; role: string }): Promise<string> {
  const token = Buffer.from(JSON.stringify({
    userId: user.id,
    name: user.name,
    role: user.role,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  })).toString('base64');

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });

  return token;
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString());
    if (data.exp < Date.now()) return null;

    const user = await dbGet('SELECT id, name, role FROM users WHERE id = ?', [data.userId]);
    if (!user) return null;

    return { userId: user.id, name: user.name, role: user.role };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<UserSession> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function requireOperator(): Promise<UserSession> {
  const session = await requireSession();
  if (session.role !== 'operator') throw new Error('Forbidden');
  return session;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
