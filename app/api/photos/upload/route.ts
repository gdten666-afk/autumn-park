import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { ensureTables, dbRun } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import sharp from 'sharp';
import type { ApiResponse, Photo } from '@/lib/types';
import {
  ensureStorageDirs,
  keyFor,
  writeImageBytes,
} from '@/lib/storage';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { apiCacheClear } from '@/lib/cache';

const MAX_SIZE = 20 * 1024 * 1024;
const MAX_DIMENSION = 12000;
const MAX_MEGAPIXELS = 40_000_000;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const session = await requireSession();

    const ip = clientIp(req);
    if (!rateLimit(`upload:${ip}`, 30, 60 * 60_000)) {
      return NextResponse.json({ ok: false, error: '上传太频繁，请稍后再试' }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const caption = ((formData.get('caption') as string) || '').trim().slice(0, 100);
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ ok: false, error: '图片不能超过 20MB' }, { status: 413 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ ok: false, error: '仅支持 JPEG / PNG / WebP' }, { status: 415 });

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Decompression-bomb guard: reject absurd dimensions before decoding fully.
    let meta;
    try {
      meta = await sharp(rawBuffer).metadata();
    } catch {
      return NextResponse.json({ ok: false, error: '无法识别的图片文件' }, { status: 422 });
    }
    const width = meta.width || 0;
    const height = meta.height || 0;
    if (width === 0 || height === 0 || width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_MEGAPIXELS) {
      return NextResponse.json({ ok: false, error: '图片尺寸超出限制' }, { status: 422 });
    }

    // Normalize: auto-rotate, cap at 2560px, recompress to progressive JPEG.
    let full: Buffer;
    let thumb: Buffer;
    try {
      full = await sharp(rawBuffer)
        .rotate()
        .resize(2560, 2560, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true, progressive: true })
        .toBuffer();
      thumb = await sharp(full)
        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 65, mozjpeg: true })
        .toBuffer();
    } catch {
      return NextResponse.json({ ok: false, error: '无法处理该图片，请换一张试试' }, { status: 422 });
    }

    ensureStorageDirs();
    const photoId = nanoid();
    const fullKey = keyFor(photoId, 'full');
    const thumbKey = keyFor(photoId, 'thumb');
    await writeImageBytes(fullKey, Buffer.from(full));
    await writeImageBytes(thumbKey, Buffer.from(thumb));

    await dbRun(
      `INSERT INTO photos (id, user_id, filename, full_key, thumb_key, caption, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [photoId, session.userId, `${photoId}.jpg`, fullKey, thumbKey, caption, isPublic ? 1 : 0],
    );
    apiCacheClear('photos:public');
    apiCacheClear('stats');

    const photo: Photo = {
      id: photoId,
      user_id: session.userId,
      filename: `${photoId}.jpg`,
      caption,
      is_public: isPublic,
      created_at: new Date().toISOString(),
    };
    return NextResponse.json({ ok: true, data: photo } satisfies ApiResponse<Photo>);
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 });
  }
}
