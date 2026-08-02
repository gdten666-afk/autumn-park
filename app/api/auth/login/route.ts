// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbGet } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';
import type { ApiResponse, UserSession } from '@/lib/types';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const ip = clientIp(req);
    if (!rateLimit(`login:${ip}`, 10, 60_000)) {
      return NextResponse.json({ ok: false, error: '尝试过于频繁，请稍后再试' }, { status: 429 });
    }
    const { name, password, inviteCode } = await req.json();
    const trimmedName = (name || '').trim();

    // Invite code + name login (passwordless fallback)
    if (inviteCode && trimmedName) {
      const user = await dbGet('SELECT id, name, role FROM users WHERE invite_code = ? AND name = ?', [inviteCode.trim(), trimmedName]);
      if (!user) {
        return NextResponse.json({ ok: false, error: '邀请码和用户名不匹配' }, { status: 404 });
      }
      // Operators must use a password — the reusable bootstrap code must not
      // remain a passwordless backdoor into the admin role.
      if (user.role === 'operator') {
        return NextResponse.json({ ok: false, error: '管理员账号请使用密码登录' }, { status: 403 });
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
