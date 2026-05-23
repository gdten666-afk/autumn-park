// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession } from '@/lib/auth';
import type { ApiResponse, UserSession } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { inviteCode } = await req.json();

    if (!inviteCode) {
      return NextResponse.json({ ok: false, error: 'Invite code is required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, name, role FROM users WHERE invite_code = ?').get(inviteCode.trim()) as any;
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Invalid invite code' }, { status: 404 });
    }

    await createSession({ id: user.id, name: user.name, role: user.role });

    const session: UserSession = { userId: user.id, name: user.name, role: user.role };
    return NextResponse.json({ ok: true, data: session });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Login failed' }, { status: 500 });
  }
}
