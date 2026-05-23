// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db';
import { createSession, hashPassword } from '@/lib/auth';
import type { ApiResponse, UserSession } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { name, inviteCode, password } = await req.json();

    if (!name || !inviteCode || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Name and invite code are required' }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    const db = getDb();
    const bootstrapCode = process.env.BOOTSTRAP_CODE;
    const isBootstrap = inviteCode.trim() === bootstrapCode;

    // Auto-create bootstrap code on first run
    if (isBootstrap) {
      db.prepare('INSERT OR IGNORE INTO invite_codes (code) VALUES (?)').run(bootstrapCode);
    }

    const code = db.prepare('SELECT * FROM invite_codes WHERE code = ?').get(inviteCode.trim()) as any;
    if (!code) {
      return NextResponse.json({ ok: false, error: 'Invalid invite code' }, { status: 404 });
    }
    if (code.used_by && !isBootstrap) {
      return NextResponse.json({ ok: false, error: 'Invite code already used' }, { status: 410 });
    }

    const trimmedName = name.trim();
    const userId = isBootstrap && code.used_by ? code.used_by : nanoid();
    const role = isBootstrap ? 'operator' : 'user';

    const pwdHash = hashPassword(password);

    if (isBootstrap && code.used_by) {
      db.prepare('UPDATE users SET name = ?, password_hash = ? WHERE id = ?').run(trimmedName, pwdHash, userId);
    } else {
      db.prepare('INSERT INTO users (id, name, password_hash, role, invite_code) VALUES (?, ?, ?, ?, ?)').run(userId, trimmedName, pwdHash, role, inviteCode.trim());
    }
    db.prepare('UPDATE invite_codes SET used_by = ? WHERE code = ?').run(userId, inviteCode.trim());
    db.prepare('INSERT OR IGNORE INTO spaces (user_id, scene, weather) VALUES (?, \'autumn-bench\', \'sunny\')').run(userId);

    const session: UserSession = { userId, name: trimmedName, role: role as any };
    await createSession({ id: userId, name: trimmedName, role });

    return NextResponse.json({ ok: true, data: session });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Registration failed' }, { status: 500 });
  }
}
