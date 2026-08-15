import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbAll, dbRun } from '@/lib/db';
import { requireOperator } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { deleteImageKeys, ensureStorageDirs, keyFor, writeImageBytes } from '@/lib/storage';
import { apiCacheClear } from '@/lib/cache';

const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR || './uploads');

// 安全拼接：只接受纯文件名，杜绝 ../ 越界
function safeLegacyPath(filename: unknown): string | null {
  if (typeof filename !== 'string' || !filename) return null;
  const base = path.basename(filename);
  if (base !== filename || base.startsWith('.')) return null;
  return path.join(UPLOAD_DIR, base);
}

function toBuffer(data: unknown): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.from(data);
  if (typeof data === 'object' && data !== null && 'bytes' in data) return Buffer.from((data as { bytes: ArrayBuffer }).bytes);
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
      // 只清理“既没有 BLOB、也没有任何存储 key”的空记录。
      // 旧逻辑用 `data IS NULL` 会误删所有走 S3/磁盘存储的现代照片。
      const brokenSql = `data IS NULL AND full_key = '' AND thumb_key = ''`;
      const photos = await dbAll<{ id: string; full_key: string; thumb_key: string; filename: string }>(`SELECT id, full_key, thumb_key, filename FROM photos WHERE ${brokenSql}`);
      for (const p of photos) {
        await deleteImageKeys([p.full_key, p.thumb_key]);
        const fp = safeLegacyPath(p.filename);
        if (fp) { try { await fs.promises.unlink(fp); } catch { /* 忽略不存在 */ } }
      }
      await dbRun(`DELETE FROM photos WHERE ${brokenSql}`);
      apiCacheClear('photos:public');
      apiCacheClear('stats');
      return NextResponse.json({ ok: true, data: { deleted: photos.length, message: `已清理 ${photos.length} 张失效照片` } });
    }

    const photos = await dbAll<{ id: string; full_key: string; thumb_key: string; filename: string }>('SELECT id, full_key, thumb_key, filename FROM photos');
    for (const p of photos) {
      await deleteImageKeys([p.full_key, p.thumb_key]);
      const fp = safeLegacyPath(p.filename);
      if (fp) { try { await fs.promises.unlink(fp); } catch { /* 忽略不存在 */ } }
    }
    await dbRun('DELETE FROM photos');
    await dbRun('DELETE FROM photo_comments');
    apiCacheClear('photos:public');
    apiCacheClear('stats');
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
    const [remaining] = await dbAll<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM photos WHERE data IS NOT NULL AND (full_key = \'\' OR thumb_key = \'\')'
    );
    if (remaining.cnt === 0) {
      return NextResponse.json({ ok: true, data: { done: true, message: '所有照片已完成' } });
    }

    const photos = await dbAll<{ id: string; data: unknown }>(
      'SELECT id, data FROM photos WHERE data IS NOT NULL AND (full_key = \'\' OR thumb_key = \'\') LIMIT ?',
      [BATCH_SIZE]
    );

    const errors: string[] = [];
    let ok = 0;
    let broken = 0;
    for (const p of photos) {
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
        ok++;
      } catch (e: unknown) {
        // 损坏数据：清空 data 字段并记录，避免每轮都重试同一张坏图导致迁移永远完不成
        broken++;
        await dbRun('UPDATE photos SET data = NULL, thumb_data = NULL WHERE id = ?', [p.id]);
        errors.push(`${String(p.id).slice(0, 20)}: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }

    apiCacheClear('photos:public');
    apiCacheClear('stats');

    const left = Math.max(0, remaining.cnt - photos.length);
    return NextResponse.json({
      ok: true,
      data: {
        done: left <= 0,
        batch: ok,
        broken,
        remaining: left,
        errors: errors.slice(0, 3),
        message: `本批: ${ok}/${photos.length}  剩余: ${left} 张`,
      },
    });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: `Failed: ${err.message}` }, { status: 500 });
  }
}
