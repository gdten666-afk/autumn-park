// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbGet } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';
import type { ApiResponse, UserSession } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const { name, password, inviteCode } = await req.json();
    const trimmedName = (name || '').trim();

    // Invite code + name login (passwordless fallback)
    if (inviteCode && trimmedName) {
      const user = await dbGet('SELECT id, name, role FROM users WHERE invite_code = ? AND name = ?', [inviteCode.trim(), trimmedName]);
      if (!user) {
        return NextResponse.json({ ok: false, error: '邀请码和用户名不匹配' }, { status: 404 });
      }
      await createSession({ id: user.id, name: user.name, role: user.role });
      return NextResponse.json({ ok: true, data: { userId: user.id, name: user.name, role: user.role } satisfies UserSession } satisfies ApiResponse<UserSession>);
    }

    if (!trimmedName || !password) {
      return NextResponse.json({ ok: false, error: 'Please enter your name and password' }, { status: 400 });
    }

    const user = await dbGet('SELECT id, name, role, password_hash FROM users WHERE name = ?', [trimmedName]);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Account not found.' }, { status: 404 });
    }

    if (!user.password_hash) {
      return NextResponse.json({ ok: false, error: 'This account has no password set yet.' }, { status: 400 });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 });
    }

    await createSession({ id: user.id, name: user.name, role: user.role });
    const session: UserSession = { userId: user.id, name: user.name, role: user.role };
    return NextResponse.json({ ok: true, data: session } satisfies ApiResponse<UserSession>);
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Login failed' }, { status: 500 });
  }
}
