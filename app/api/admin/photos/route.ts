import { NextResponse } from 'next/server';
import { ensureTables, dbAll, dbRun } from '@/lib/db';
import { requireOperator } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export async function DELETE() {
  try {
    await ensureTables();
    await requireOperator();

    const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
    const photos = await dbAll('SELECT filename FROM photos');

    for (const p of photos) {
      const fp = path.join(UPLOAD_DIR, p.filename);
      try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
    }

    await dbRun('DELETE FROM photos');

    return NextResponse.json({ ok: true, data: { deleted: photos.length } });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}
