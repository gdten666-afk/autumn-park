import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbAll, dbBatch } from '@/lib/db';
import { requireOperator } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import { deleteImageKeys } from '@/lib/storage';
import { apiCacheClear } from '@/lib/cache';

const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR || './uploads');

// 安全拼接：只接受纯文件名，杜绝 ../ 越界
function safeLegacyPath(filename: unknown): string | null {
  if (typeof filename !== 'string' || !filename) return null;
  const base = path.basename(filename);
  if (base !== filename || base.startsWith('.')) return null;
  return path.join(UPLOAD_DIR, base);
}

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
    if (!userId || typeof userId !== 'string') return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });

    const photos = await dbAll<{ id: string; filename: string; full_key: string; thumb_key: string }>('SELECT id, filename, full_key, thumb_key FROM photos WHERE user_id = ?', [userId]);

    // 1) 先删存储对象与遗留文件（失败不阻断；DB 记录由事务删除）
    for (const p of photos) {
      await deleteImageKeys([p.full_key, p.thumb_key]);
      const fp = safeLegacyPath(p.filename);
      if (fp) { try { await fs.promises.unlink(fp); } catch { /* 忽略 */ } }
    }

    // 2) 单事务删除全部关联数据（含他人对 TA 照片的评论）
    await dbBatch([
      { sql: 'DELETE FROM photo_comments WHERE photo_id IN (SELECT id FROM photos WHERE user_id = ?)', args: [userId] },
      { sql: 'DELETE FROM photo_comments WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM photos WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM weather_votes WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM spaces WHERE user_id = ?', args: [userId] },
      { sql: 'UPDATE invite_codes SET used_by = NULL WHERE used_by = ?', args: [userId] },
      { sql: 'DELETE FROM users WHERE id = ? AND role != \'operator\'', args: [userId] },
    ]);

    apiCacheClear('photos:public');
    apiCacheClear('stats');
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}
