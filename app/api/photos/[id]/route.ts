import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbGet, dbRun } from '@/lib/db';
import { requireSession, getSession } from '@/lib/auth';
import { fullImageCache, thumbCache } from '@/lib/cache';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureTables();
    const { id } = await params;
    const session = await requireSession();
    const photo = await dbGet('SELECT * FROM photos WHERE id = ?', [id]);
    if (!photo) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
    if (photo.user_id !== session.userId && session.role !== 'operator') return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const { caption, isPublic } = await req.json();
    if (caption !== undefined) await dbRun('UPDATE photos SET caption = ? WHERE id = ?', [caption, id]);
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
    const filePath = path.join(UPLOAD_DIR, photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await dbRun('DELETE FROM photos WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    return NextResponse.json({ ok: false, error: 'Delete failed' }, { status: 500 });
  }
}

function toBuf(data: any) {
  return Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
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
    // --- ETag check ---
    const etag = `"${cacheKey}"`;
    if (req.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // --- Memory cache hit ---
    if (isThumb) {
      const cached = thumbCache.get(cacheKey);
      if (cached) {
        return new NextResponse(cached as any, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': etag,
          },
        });
      }
    }
    if (isFile || isMedium) {
      const cached = fullImageCache.get(cacheKey);
      if (cached) {
        const ext = cacheKey.includes(':') ? 'jpeg' : 'jpeg';
        return new NextResponse(cached as any, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
            'ETag': etag,
          },
        });
      }
    }

    // --- Fetch from DB ---
    const photo = await dbGet(
      'SELECT filename, data, thumb_data, is_public, user_id FROM photos WHERE id = ?', [id]
    );
    if (!photo) return new NextResponse('Not found', { status: 404 });

    // Permission check
    if (!photo.is_public) {
      const session = await getSession();
      if (!session || (session.userId !== photo.user_id && session.role !== 'operator')) {
        return new NextResponse('Not found', { status: 404 });
      }
    }

    // Resolve source buffer
    let buf: Buffer | null = null;
    let isJpeg = true;

    if (isThumb && photo.thumb_data) {
      buf = toBuf(photo.thumb_data);
      thumbCache.set(cacheKey, buf, buf.length);
    } else if ((isFile || isMedium) && photo.data) {
      buf = toBuf(photo.data);
      // For medium size, resize to 1200px
      if (isMedium && buf.length > 200 * 1024) {
        try {
          const resized = await sharp(buf)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82, progressive: true })
            .toBuffer();
          buf = Buffer.from(resized.buffer);
        } catch { /* keep original */ }
      }
      if (buf.length < 50 * 1024 * 1024) {
        fullImageCache.set(cacheKey, buf, buf.length);
      }
    } else {
      // Disk fallback
      const fp = path.join(UPLOAD_DIR, photo.filename);
      if (!fs.existsSync(fp)) return new NextResponse('File missing', { status: 404 });
      buf = fs.readFileSync(fp);
      isJpeg = photo.filename.endsWith('.jpg') || photo.filename.endsWith('.jpeg');
    }

    if (!buf) return new NextResponse('File missing', { status: 404 });

    const ext = photo.filename.split('.').pop();
    const contentType = isJpeg ? 'image/jpeg' : ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const cacheHeader = isThumb
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=86400';

    return new NextResponse(buf as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheHeader,
        'ETag': etag,
      },
    });
  }

  // JSON metadata response
  const photo = await dbGet(
    'SELECT photos.id, photos.user_id, photos.filename, photos.caption, photos.is_public, photos.created_at, users.name as author_name FROM photos JOIN users ON photos.user_id = users.id WHERE photos.id = ?',
    [id]
  );
  if (!photo) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
  return NextResponse.json({ ok: true, data: photo });
}
