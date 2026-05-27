import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbAll, dbRun } from '@/lib/db';
import { requireOperator } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

// DELETE all photos
export async function DELETE() {
  try {
    await ensureTables();
    await requireOperator();

    const photos = await dbAll('SELECT filename FROM photos');
    for (const p of photos) {
      try { const fp = path.join(UPLOAD_DIR, p.filename); if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
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

// POST: regenerate thumbnails for photos missing them
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    await requireOperator();

    const { photoId } = await req.json().catch(() => ({}));

    if (photoId) {
      // Single photo
      const photo = await dbAll('SELECT id, data FROM photos WHERE id = ? AND thumb_data IS NULL', [photoId]);
      if (!photo.length) return NextResponse.json({ ok: false, error: 'Photo not found or already has thumbnail' }, { status: 404 });
      await generateThumb(photo[0]);
      return NextResponse.json({ ok: true, data: { regenerated: 1 } });
    }

    // All photos without thumbnails
    const photos = await dbAll('SELECT id, data FROM photos WHERE data IS NOT NULL AND thumb_data IS NULL');
    let count = 0;
    for (const p of photos) {
      try {
        await generateThumb(p);
        count++;
      } catch { /* skip failed ones */ }
    }
    return NextResponse.json({ ok: true, data: { regenerated: count, total: photos.length } });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}

async function generateThumb(photo: { id: string; data: Buffer | ArrayBuffer }) {
  const buf = Buffer.isBuffer(photo.data) ? photo.data : Buffer.from(photo.data as ArrayBuffer);
  const thumbBuffer = await sharp(buf)
    .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
  await dbRun('UPDATE photos SET thumb_data = ? WHERE id = ?', [thumbBuffer, photo.id]);
}
