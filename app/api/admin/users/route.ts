import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbAll, dbRun } from '@/lib/db';
import { requireOperator } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

export async function GET() {
  try {
    await ensureTables();
    await requireOperator();
    const users = await dbAll('SELECT u.id, u.name, u.role, u.invite_code, u.created_at, COUNT(p.id) as photo_count FROM users u LEFT JOIN photos p ON u.id = p.user_id GROUP BY u.id ORDER BY u.created_at DESC');
    return NextResponse.json({ ok: true, data: users });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureTables();
    await requireOperator();
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
    const photos = await dbAll('SELECT filename FROM photos WHERE user_id = ?', [userId]);
    for (const p of photos) {
      const filePath = path.join(UPLOAD_DIR, p.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await dbRun('DELETE FROM photos WHERE user_id = ?', [userId]);
    await dbRun('DELETE FROM weather_votes WHERE user_id = ?', [userId]);
    await dbRun('DELETE FROM spaces WHERE user_id = ?', [userId]);
    await dbRun('UPDATE invite_codes SET used_by = NULL WHERE used_by = ?', [userId]);
    await dbRun('DELETE FROM users WHERE id = ? AND role != ?', [userId, 'operator']);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}
