// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';
import type { ApiResponse, UserSession } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { name, password, inviteCode } = await req.json();

    const db = getDb();
    let user: any = null;

    // Login by invite code (for legacy accounts or bootstrap code)
    if (inviteCode && !name) {
      user = db.prepare('SELECT id, name, role, password_hash FROM users WHERE invite_code = ?').get(inviteCode.trim()) as any;
      if (!user) {
        return NextResponse.json({ ok: false, error: 'Invalid invite code. Register first?' }, { status: 404 });
      }
      await createSession({ id: user.id, name: user.name, role: user.role });
      const session: UserSession = { userId: user.id, name: user.name, role: user.role };
      return NextResponse.json({ ok: true, data: session });
    }

    // Login by name + password
    if (!name || !password) {
      return NextResponse.json({ ok: false, error: 'Please enter your name and password, or use an invite code' }, { status: 400 });
    }

    user = db.prepare('SELECT id, name, role, password_hash FROM users WHERE name = ?').get(name.trim()) as any;
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Account not found. Check your name, or use the Register tab if you\'re new.' }, { status: 404 });
    }

    if (!user.password_hash) {
      return NextResponse.json({ ok: false, error: 'This account needs a password. Please use the Register tab with your invite code to set one.' }, { status: 400 });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 });
    }

    await createSession({ id: user.id, name: user.name, role: user.role });

    const session: UserSession = { userId: user.id, name: user.name, role: user.role };
    return NextResponse.json({ ok: true, data: session });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Login failed' }, { status: 500 });
  }
}
