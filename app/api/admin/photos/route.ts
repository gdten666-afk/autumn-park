import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbAll, dbRun } from '@/lib/db';
import { requireOperator } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { deleteImageKeys, ensureStorageDirs, keyFor, writeImageBytes } from '@/lib/storage';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

function toBuffer(data: any): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.from(data);
  if (typeof data === 'object' && data !== null && 'bytes' in data) return Buffer.from(data.bytes);
  if (typeof data === 'string') return Buffer.from(data, 'base64');
  throw new Error(`unsupported: ${typeof data}`);
}

// DELETE all photos (or only broken ones with ?broken=1)
export async function DELETE(req: NextRequest) {
  try {
    await ensureTables();
    await requireOperator();
    const url = new URL(req.url);
    const brokenOnly = url.searchParams.get('broken') === '1';

    if (brokenOnly) {
      const photos = await dbAll('SELECT id, full_key, thumb_key FROM photos WHERE data IS NULL');
      for (const p of photos) {
        await deleteImageKeys([p.full_key, p.thumb_key]);
        try {
          const fp = path.join(UPLOAD_DIR, p.filename);
          if (fs.existsSync(fp)) fs.unlinkSync(fp);
        } catch {}
      }
      await dbRun('DELETE FROM photos WHERE data IS NULL');
      return NextResponse.json({ ok: true, data: { deleted: photos.length, message: `已清理 ${photos.length} 张失效照片` } });
    }

    const photos = await dbAll('SELECT id, full_key, thumb_key FROM photos');
    for (const p of photos) {
      await deleteImageKeys([p.full_key, p.thumb_key]);
      try {
        const fp = path.join(UPLOAD_DIR, p.filename);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } catch {}
    }
    await dbRun('DELETE FROM photos');
    await dbRun('DELETE FROM photo_comments');
    return NextResponse.json({ ok: true, data: { deleted: photos.length } });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: `Failed: ${err.message}` }, { status: 500 });
  }
}

// POST: migrate legacy DB-blob photos into the storage layer + regenerate thumbs
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    await requireOperator();
    ensureStorageDirs();

    const BATCH_SIZE = 1; // free-tier CPU is weak; keep batches tiny
    const [remaining] = await dbAll(
      'SELECT COUNT(*) as cnt FROM photos WHERE data IS NOT NULL AND (full_key = \'\' OR thumb_key = \'\')'
    );
    if (remaining.cnt === 0) {
      return NextResponse.json({ ok: true, data: { done: true, message: '所有照片已完成' } });
    }

    const photos = await dbAll(
      'SELECT id, data FROM photos WHERE data IS NOT NULL AND (full_key = \'\' OR thumb_key = \'\') LIMIT ?',
      [BATCH_SIZE]
    );

    const errors: string[] = [];
    let ok = 0;
    const results = await Promise.all(
      photos.map(async (p: any) => {
        try {
          const buf = toBuffer(p.data);
          const fullKey = keyFor(p.id, 'full');
          const thumbKey = keyFor(p.id, 'thumb');
          const thumb = await sharp(buf)
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 65, mozjpeg: true })
            .toBuffer();
          await writeImageBytes(fullKey, Buffer.from(buf));
          await writeImageBytes(thumbKey, Buffer.from(thumb));
          await dbRun(
            'UPDATE photos SET full_key = ?, thumb_key = ?, data = NULL, thumb_data = NULL WHERE id = ?',
            [fullKey, thumbKey, p.id]
          );
          return { id: p.id, ok: true };
        } catch (e: any) {
          return { id: p.id, error: e.message };
        }
      })
    );

    for (const r of results) {
      if ('ok' in r && r.ok) ok++;
      else if ('error' in r) errors.push(`${(r.id || '').slice(0, 20)}: ${r.error}`);
    }

    const left = remaining.cnt - photos.length;
    return NextResponse.json({
      ok: true,
      data: {
        done: left <= 0,
        batch: ok,
        remaining: Math.max(0, left),
        errors: errors.slice(0, 3),
        message: `本批: ${ok}/${photos.length}  剩余: ${Math.max(0, left)} 张`,
      },
    });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: `Failed: ${err.message}` }, { status: 500 });
  }
}
