import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbGet, dbRun } from '@/lib/db';
import { requireSession, getSession } from '@/lib/auth';
import { apiCacheClear, fullImageCache, thumbCache } from '@/lib/cache';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { deleteImageKeys, readImageBytes } from '@/lib/storage';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

function toBuf(data: any): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.from(data);
  if (data && typeof data === 'object' && 'bytes' in data) return Buffer.from(data.bytes);
  if (typeof data === 'string') return Buffer.from(data, 'base64');
  return Buffer.from(data as ArrayBuffer);
}

async function canView(photo: any): Promise<boolean> {
  if (photo.is_public) return true;
  const session = await getSession();
  return Boolean(session && (session.userId === photo.user_id || session.role === 'operator'));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureTables();
    const { id } = await params;
    const session = await requireSession();
    const photo = await dbGet('SELECT * FROM photos WHERE id = ?', [id]);
    if (!photo) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
    if (photo.user_id !== session.userId && session.role !== 'operator') return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const { caption, isPublic } = await req.json();
    if (caption !== undefined) {
      const trimmed = typeof caption === 'string' ? caption.trim().slice(0, 100) : '';
      await dbRun('UPDATE photos SET caption = ? WHERE id = ?', [trimmed, id]);
    }
    if (isPublic !== undefined) await dbRun('UPDATE photos SET is_public = ? WHERE id = ?', [isPublic ? 1 : 0, id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureTables();
    const { id } = await params;
    const session = await requireSession();
    const photo = await dbGet('SELECT * FROM photos WHERE id = ?', [id]);
    if (!photo) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
    if (photo.user_id !== session.userId && session.role !== 'operator') return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    await deleteImageKeys([photo.full_key, photo.thumb_key]);
    const legacyFile = path.join(UPLOAD_DIR, photo.filename);
    if (fs.existsSync(legacyFile)) fs.unlinkSync(legacyFile);
    await dbRun('DELETE FROM photos WHERE id = ?', [id]);
    await dbRun('DELETE FROM photo_comments WHERE photo_id = ?', [id]);
    apiCacheClear('photos:public');
    apiCacheClear('stats');
    fullImageCache.delete(`${id}:full`);
    fullImageCache.delete(`${id}:medium`);
    thumbCache.delete(`${id}:thumb`);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    return NextResponse.json({ ok: false, error: 'Delete failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureTables();
  const { id } = await params;
  const url = new URL(req.url);
  const isFile = url.searchParams.get('file') === '1';
  const isThumb = url.searchParams.get('thumb') === '1';
  const isMedium = url.searchParams.get('medium') === '1';
  const cacheKey = `${id}:${isThumb ? 'thumb' : isMedium ? 'medium' : 'full'}`;

  if (isFile || isThumb || isMedium) {
    const etag = `"${cacheKey}"`;
    if (req.headers.get('if-none-match') === etag) return new NextResponse(null, { status: 304 });

    // Memory cache
    const cache = isThumb ? thumbCache : fullImageCache;
    const cached = cache.get(cacheKey);
    if (cached) {
      return new NextResponse(cached as any, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': isThumb ? 'public, max-age=31536000, immutable' : 'public, max-age=86400',
          ETag: etag,
        },
      });
    }

    // 缩略图只取缩略图字段，避免为一张小图把整张原图 blob 从数据库拖回来。
    const photo = isThumb
      ? await dbGet(
          'SELECT id, thumb_key, thumb_data, is_public, user_id FROM photos WHERE id = ?',
          [id],
        )
      : await dbGet(
          'SELECT id, filename, data, full_key, is_public, user_id FROM photos WHERE id = ?',
          [id],
        );
    if (!photo) return new NextResponse('Not found', { status: 404 });
    if (!(await canView(photo))) return new NextResponse('Not found', { status: 404 });

    let buf: Buffer | null = null;
    let contentType = 'image/jpeg';

    if (isThumb) {
      if (photo.thumb_key) {
        const stored = await readImageBytes(photo.thumb_key);
        if (stored) { buf = stored.bytes; contentType = stored.contentType; }
      }
      if (!buf && photo.thumb_data) buf = toBuf(photo.thumb_data);
    } else {
      if (photo.full_key) {
        const stored = await readImageBytes(photo.full_key);
        if (stored) { buf = stored.bytes; contentType = stored.contentType; }
      }
      if (!buf && photo.data) buf = toBuf(photo.data);
      if (!buf) {
        // Legacy disk fallback
        const fp = path.join(UPLOAD_DIR, photo.filename);
        if (fs.existsSync(fp)) {
          buf = fs.readFileSync(fp);
          contentType = photo.filename.endsWith('.png') ? 'image/png' : photo.filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        }
      }
      if (buf && isMedium && buf.length > 200 * 1024) {
        try {
          const resized = await sharp(buf)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82, progressive: true })
            .toBuffer();
          buf = Buffer.from(resized.buffer);
          contentType = 'image/jpeg';
        } catch { /* keep original */ }
      }
    }

    if (!buf) return new NextResponse('File missing', { status: 404 });
    if (buf.length < 50 * 1024 * 1024) cache.set(cacheKey, buf, buf.length);

    return new NextResponse(buf as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': isThumb ? 'public, max-age=31536000, immutable' : 'public, max-age=86400',
        ETag: etag,
      },
    });
  }

  // JSON metadata — private photos are only visible to owner/operator.
  const photo = await dbGet(
    `SELECT photos.id, photos.user_id, photos.filename, photos.caption, photos.is_public,
            photos.created_at, users.name as author_name
     FROM photos JOIN users ON photos.user_id = users.id WHERE photos.id = ?`,
    [id],
  );
  if (!photo) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
  if (!(await canView(photo))) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
  return NextResponse.json({ ok: true, data: photo });
}
