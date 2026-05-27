import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbGet, dbRun } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function PATCH(req: NextRequest) {
  try {
    await ensureTables();
    const session = await requireSession();
    const { displayName, bio } = await req.json();

    if (displayName !== undefined) {
      const name = typeof displayName === 'string' ? displayName.trim().slice(0, 24) : '';
      await dbRun('UPDATE users SET display_name = ? WHERE id = ?', [name, session.userId]);
    }
    if (bio !== undefined) {
      const bioText = typeof bio === 'string' ? bio.trim().slice(0, 120) : '';
      await dbRun('UPDATE users SET bio = ? WHERE id = ?', [bioText, session.userId]);
    }

    const user = await dbGet('SELECT id, name, display_name, bio, role FROM users WHERE id = ?', [session.userId]);
    return NextResponse.json({ ok: true, data: user } satisfies ApiResponse);
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 500 });
  }
}
