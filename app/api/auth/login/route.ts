// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbGet } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';
import type { ApiResponse, UserSession } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const { name, password } = await req.json();

    if (!name || !password) {
      return NextResponse.json({ ok: false, error: 'Please enter your name and password' }, { status: 400 });
    }

    const user = await dbGet('SELECT id, name, role, password_hash FROM users WHERE name = ?', [name.trim()]);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Account not found. Check your name, or use the Register tab if you\'re new.' }, { status: 404 });
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
