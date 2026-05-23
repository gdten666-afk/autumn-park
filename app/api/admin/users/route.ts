// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireOperator } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

export async function GET() {
  try {
    await requireOperator();
    const db = getDb();
    const users = db.prepare(`
      SELECT u.*, COUNT(p.id) as photo_count
      FROM users u LEFT JOIN photos p ON u.id = p.user_id
      GROUP BY u.id ORDER BY u.created_at DESC
    `).all();
    return NextResponse.json({ ok: true, data: users });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireOperator();
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });

    const db = getDb();

    // Delete user's photos from disk
    const photos = db.prepare('SELECT filename FROM photos WHERE user_id = ?').all(userId) as any[];
    for (const p of photos) {
      const filePath = path.join(UPLOAD_DIR, p.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM photos WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM weather_votes WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM spaces WHERE user_id = ?').run(userId);
    db.prepare('UPDATE invite_codes SET used_by = NULL WHERE used_by = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ? AND role != ?').run(userId, 'operator');

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}
