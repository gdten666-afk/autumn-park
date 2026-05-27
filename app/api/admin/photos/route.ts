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

    // Get all photos that need processing (missing thumb or missing data)
    const photos = await dbAll(
      'SELECT id, filename, data, thumb_data FROM photos WHERE thumb_data IS NULL OR data IS NULL'
    );

    let fromDb = 0, fromDisk = 0, failed = 0;
    const errors: string[] = [];

    for (const p of photos) {
      try {
        let buf: Buffer | null = null;

        // Try DB data first
        if (p.data) {
          buf = toBuffer(p.data);
          fromDb++;
        }

        // Fall back to disk
        if (!buf) {
          const fp = path.join(UPLOAD_DIR, p.filename);
          if (fs.existsSync(fp)) {
            buf = fs.readFileSync(fp);
            fromDisk++;
          }
        }

        if (!buf) {
          failed++;
          continue;
        }

        // Store full data in DB if missing
        if (!p.data) {
          await dbRun('UPDATE photos SET data = ? WHERE id = ?', [buf, p.id]);
        }

        // Generate and store thumbnail
        const thumb = await sharp(buf)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 70 })
          .toBuffer();
        await dbRun('UPDATE photos SET thumb_data = ? WHERE id = ?', [thumb, p.id]);
      } catch (e: any) {
        failed++;
        if (errors.length < 5) errors.push(`${(p.filename || p.id).slice(0, 30)}: ${e.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        total: photos.length,
        fromDb,
        fromDisk,
        failed,
        errors,
        message: `DB: ${fromDb}, 磁盘: ${fromDisk}, 失败: ${failed}${errors.length ? ' — ' + errors[0] : ''}`,
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
