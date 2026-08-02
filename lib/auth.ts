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
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.BOOTSTRAP_CODE ||
  'park-session-secret';

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET && !process.env.BOOTSTRAP_CODE) {
  console.warn('[auth] SESSION_SECRET is not set in production — sessions are NOT secure. Set SESSION_SECRET now.');
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

export async function createSession(user: { id: string; name: string; role: string }): Promise<string> {
  const payload = JSON.stringify({
    userId: user.id,
    name: user.name,
    role: user.role,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  const token = `${Buffer.from(payload).toString('base64')}.${sign(payload)}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Secure in production by default; COOKIE_SECURE=false allows plain-HTTP
    // local development/testing against a production build.
    secure:
      process.env.NODE_ENV === 'production'
        ? process.env.COOKIE_SECURE !== 'false'
        : false,
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
    const dotIdx = token.lastIndexOf('.');

    // New format: base64(payload).hmac_signature
    if (dotIdx !== -1) {
      const payloadB64 = token.slice(0, dotIdx);
      const signature = token.slice(dotIdx + 1);
      const payload = Buffer.from(payloadB64, 'base64').toString();
      if (sign(payload) !== signature) return null;
      const data = JSON.parse(payload);
      if (data.exp < Date.now()) return null;
      const user = await dbGet('SELECT id, name, role FROM users WHERE id = ?', [data.userId]);
      if (!user) return null;
      return { userId: user.id, name: user.name, role: user.role };
    }

    // Legacy unsigned tokens are no longer accepted (session forgery fix).
    return null;
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
