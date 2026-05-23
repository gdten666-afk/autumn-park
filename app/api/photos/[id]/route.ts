// app/api/photos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const db = getDb();
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id) as any;
    if (!photo) {
      return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
    }
    if (photo.user_id !== session.userId && session.role !== 'operator') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const { caption, isPublic } = await req.json();
    if (caption !== undefined) {
      db.prepare('UPDATE photos SET caption = ? WHERE id = ?').run(caption, id);
    }
    if (isPublic !== undefined) {
      db.prepare('UPDATE photos SET is_public = ? WHERE id = ?').run(isPublic ? 1 : 0, id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const db = getDb();
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id) as any;
    if (!photo) {
      return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
    }
    if (photo.user_id !== session.userId && session.role !== 'operator') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const filePath = path.join(UPLOAD_DIR, photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare('DELETE FROM photos WHERE id = ?').run(id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    return NextResponse.json({ ok: false, error: 'Delete failed' }, { status: 500 });
  }
}

// GET: serve file (?file=1) or return metadata
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const isFile = url.searchParams.get('file') === '1';

  if (isFile) {
    const db = getDb();
    const photo = db.prepare('SELECT filename FROM photos WHERE id = ?').get(id) as any;
    if (!photo) return new NextResponse('Not found', { status: 404 });

    const filePath = path.join(UPLOAD_DIR, photo.filename);
    if (!fs.existsSync(filePath)) return new NextResponse('File missing', { status: 404 });

    const buffer = fs.readFileSync(filePath);
    const ext = photo.filename.split('.').pop();
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    return new NextResponse(buffer, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' },
    });
  }

  // Return photo metadata
  const db = getDb();
  const photo = db.prepare(`
    SELECT photos.*, users.name as author_name
    FROM photos JOIN users ON photos.user_id = users.id
    WHERE photos.id = ?
  `).get(id) as any;

  if (!photo) {
    return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: photo });
}
