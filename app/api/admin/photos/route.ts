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
    return NextResponse.json({ ok: false, error: `Failed: ${err.message}` }, { status: 500 });
  }
}

// POST: migrate old photos (disk→DB) + regenerate thumbnails
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    await requireOperator();

    const BATCH_SIZE = 5;

    // Count remaining
    const [remaining] = await dbAll(
      'SELECT COUNT(*) as cnt FROM photos WHERE thumb_data IS NULL OR data IS NULL'
    );

    if (remaining.cnt === 0) {
      return NextResponse.json({ ok: true, data: { done: true, message: '所有照片已完成' } });
    }

    // Fetch one batch
    const photos = await dbAll(
      'SELECT id, filename, data, thumb_data FROM photos WHERE thumb_data IS NULL OR data IS NULL LIMIT ?',
      [BATCH_SIZE]
    );

    const errors: string[] = [];
    let ok = 0;

    // Process in parallel (max 5 images at once since batch is 5)
    const results = await Promise.all(
      photos.map(async (p: any) => {
        try {
          let buf: Buffer | null = null;
          if (p.data) {
            buf = toBuffer(p.data);
          } else {
            const fp = path.join(UPLOAD_DIR, p.filename);
            if (fs.existsSync(fp)) buf = fs.readFileSync(fp);
          }
          if (!buf) return { id: p.id, error: 'no image source' };

          const thumb = await sharp(buf)
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 70 })
            .toBuffer();

          if (!p.data) await dbRun('UPDATE photos SET data = ?, thumb_data = ? WHERE id = ?', [buf, thumb, p.id]);
          else await dbRun('UPDATE photos SET thumb_data = ? WHERE id = ?', [thumb, p.id]);

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
