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

    const photos = await dbAll(
      'SELECT id, filename, data, thumb_data FROM photos WHERE thumb_data IS NULL OR data IS NULL'
    );

    if (photos.length === 0) {
      return NextResponse.json({ ok: true, data: { total: 0, message: '所有照片已有缩略图' } });
    }

    // Phase 1: resolve all image buffers (parallel disk reads)
    const resolved: { id: string; buf: Buffer; needData: boolean }[] = [];
    const errors: string[] = [];
    for (const p of photos) {
      try {
        let buf: Buffer | null = null;
        if (p.data) {
          buf = toBuffer(p.data);
        } else {
          const fp = path.join(UPLOAD_DIR, p.filename);
          if (fs.existsSync(fp)) buf = fs.readFileSync(fp);
        }
        if (!buf) { errors.push(`${p.filename}: no source`); continue; }
        resolved.push({ id: p.id, buf, needData: !p.data });
      } catch (e: any) {
        errors.push(`${p.filename}: ${e.message}`);
      }
    }

    // Phase 2: generate thumbnails in parallel (CPU-bound, concurrency=6)
    const CONCURRENCY = 6;
    const results: { id: string; thumb: Buffer; needData: boolean; buf: Buffer; error?: string }[] = [];
    for (let i = 0; i < resolved.length; i += CONCURRENCY) {
      const batch = resolved.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async ({ id, buf, needData }) => {
          try {
            const thumb = await sharp(buf)
              .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 70 })
              .toBuffer();
            return { id, thumb, needData, buf };
          } catch (e: any) {
            return { id, thumb: null as any, needData, buf, error: e.message };
          }
        })
      );
      results.push(...batchResults);
    }

    // Phase 3: write all results to DB (batch per 10 to avoid huge transactions)
    let ok = 0, failed = 0;
    for (let i = 0; i < results.length; i += 10) {
      const batch = results.slice(i, i + 10);
      const writes = batch.map(async ({ id, thumb, needData, buf, error }) => {
        if (error) { failed++; errors.push(`${id}: ${error}`); return; }
        try {
          if (needData) await dbRun('UPDATE photos SET data = ?, thumb_data = ? WHERE id = ?', [buf, thumb, id]);
          else await dbRun('UPDATE photos SET thumb_data = ? WHERE id = ?', [thumb, id]);
          ok++;
        } catch (e: any) { failed++; errors.push(`${id}: ${e.message}`); }
      });
      await Promise.all(writes);
    }

    return NextResponse.json({
      ok: true,
      data: {
        total: photos.length,
        ok,
        failed,
        errors: errors.slice(0, 5),
        message: `成功: ${ok}, 失败: ${failed}${errors.length ? ' — ' + errors[0] : ''}`,
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
