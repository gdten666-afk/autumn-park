// app/api/photos/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import type { ApiResponse, Photo } from '@/lib/types';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const caption = (formData.get('caption') as string) || '';
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: 'File too large (max 10MB)' }, { status: 413 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ ok: false, error: 'Only JPEG, PNG, WebP allowed' }, { status: 415 });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const photoId = nanoid();
    const ext = file.type.split('/')[1];
    const filename = `${photoId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

    const db = getDb();
    db.prepare(
      'INSERT INTO photos (id, user_id, filename, caption, is_public) VALUES (?, ?, ?, ?, ?)'
    ).run(photoId, session.userId, filename, caption, isPublic ? 1 : 0);

    const photo: Photo = {
      id: photoId,
      user_id: session.userId,
      filename,
      caption,
      is_public: isPublic,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, data: photo } satisfies ApiResponse<Photo>);
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 });
  }
}
