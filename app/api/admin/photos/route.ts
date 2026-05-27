import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbAll, dbRun } from '@/lib/db';
import { requireOperator } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

// DELETE all photos (or only broken ones with ?broken=1)
export async function DELETE(req: NextRequest) {
  try {
    await ensureTables();
    await requireOperator();
    const url = new URL(req.url);
    const brokenOnly = url.searchParams.get('broken') === '1';

    if (brokenOnly) {
      const photos = await dbAll('SELECT id, filename FROM photos WHERE data IS NULL');
      for (const p of photos) {
        try { const fp = path.join(UPLOAD_DIR, p.filename); if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
      }
      await dbRun('DELETE FROM photos WHERE data IS NULL');
      return NextResponse.json({ ok: true, data: { deleted: photos.length, message: `已清理 ${photos.length} 张失效照片` } });
    }

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
    return NextResponse.json({ ok: false, error: `Failed: ${err.message}` }, { status: 500 });
  }
}

// POST: migrate old photos (disk→DB) + regenerate thumbnails
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    await requireOperator();

    const BATCH_SIZE = 1;  // Process 1 at a time — free tier CPU is too weak for parallel

    // Only process photos with BLOB data (disk-only photos with NULL data can't be recovered)
    const [remaining] = await dbAll(
      'SELECT COUNT(*) as cnt FROM photos WHERE data IS NOT NULL AND thumb_data IS NULL'
    );

    if (remaining.cnt === 0) {
      return NextResponse.json({ ok: true, data: { done: true, message: '所有照片已完成' } });
    }

    // Fetch one batch
    const photos = await dbAll(
      'SELECT id, data FROM photos WHERE data IS NOT NULL AND thumb_data IS NULL LIMIT ?',
      [BATCH_SIZE]
    );

    const errors: string[] = [];
    let ok = 0;

    // Process in parallel (max 5 at once)
    const results = await Promise.all(
      photos.map(async (p: any) => {
        try {
          const buf = toBuffer(p.data);
          const thumb = await sharp(buf)
            .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 60, mozjpeg: true })
            .toBuffer();
          await dbRun('UPDATE photos SET thumb_data = ? WHERE id = ?', [thumb, p.id]);
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

function toBuffer(data: any): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.from(data); // libsql might return byte array
  if (typeof data === 'object' && data !== null && 'bytes' in data) return Buffer.from(data.bytes);
  if (typeof data === 'string') return Buffer.from(data, 'base64');
  throw new Error(`unsupported: ${typeof data}`);
}
