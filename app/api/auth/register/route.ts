// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { ensureTables, dbGet, dbRun } from '@/lib/db';
import { createSession, hashPassword } from '@/lib/auth';
import type { ApiResponse, UserSession, UserRole } from '@/lib/types';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const ip = clientIp(req);
    if (!rateLimit(`register:${ip}`, 5, 60_000)) {
      return NextResponse.json({ ok: false, error: '注册太频繁，请稍后再试' }, { status: 429 });
    }
    const { name, inviteCode, password } = await req.json();

    if (!name || !inviteCode || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Name and invite code are required' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ ok: false, error: '密码至少需要 8 位' }, { status: 400 });
    }

    const bootstrapCode = process.env.BOOTSTRAP_CODE;
    const isBootstrap = inviteCode.trim() === bootstrapCode;

    const code = await dbGet('SELECT * FROM invite_codes WHERE code = ?', [inviteCode.trim()]);
    if (!code) {
      return NextResponse.json({ ok: false, error: 'Invalid invite code' }, { status: 404 });
    }
    if (code.used_by && !isBootstrap) {
      return NextResponse.json({ ok: false, error: 'Invite code already used' }, { status: 410 });
    }

    const trimmedName = name.trim().slice(0, 32);
    if (trimmedName.length === 0) {
      return NextResponse.json({ ok: false, error: '请输入用户名' }, { status: 400 });
    }

    // 引导码只用于“首次创建”管理员账号；已使用后禁止再用它覆盖账号（防接管）。
    if (isBootstrap && code.used_by) {
      return NextResponse.json({ ok: false, error: 'Bootstrap account already exists' }, { status: 409 });
    }

    // 用户名有唯一索引，重复时给出明确提示，而不是 500。
    const existing = await dbGet('SELECT id FROM users WHERE name = ?', [trimmedName]);
    if (existing) {
      return NextResponse.json({ ok: false, error: '用户名已存在' }, { status: 409 });
    }

    const userId = nanoid();
    const role: UserRole = isBootstrap ? 'operator' : 'user';
    const pwdHash = hashPassword(password);
    await dbRun('INSERT INTO users (id, name, password_hash, role, invite_code) VALUES (?, ?, ?, ?, ?)', [userId, trimmedName, pwdHash, role, inviteCode.trim()]);
    await dbRun('UPDATE invite_codes SET used_by = ? WHERE code = ?', [userId, inviteCode.trim()]);
    await dbRun('INSERT OR IGNORE INTO spaces (user_id, scene, weather) VALUES (?, \'autumn-bench\', \'sunny\')', [userId]);

    const session: UserSession = { userId, name: trimmedName, role };
    await createSession({ id: userId, name: trimmedName, role });

    return NextResponse.json({ ok: true, data: session });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Registration failed' }, { status: 500 });
  }
}
