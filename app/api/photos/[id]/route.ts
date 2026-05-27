import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbGet, dbRun } from '@/lib/db';
import { requireSession } from '@/lib/auth';
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureTables();
  const { id } = await params;
  const url = new URL(req.url);
  const isFile = url.searchParams.get('file') === '1';
  const isThumb = url.searchParams.get('thumb') === '1';
  if (isFile || isThumb) {
    const photo = await dbGet('SELECT filename, data FROM photos WHERE id = ?', [id]);
    if (!photo) return new NextResponse('Not found', { status: 404 });

    // Serve from database BLOB if available (new uploads)
    if (photo.data) {
      const ext = photo.filename.split('.').pop();
      const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const buf = Buffer.isBuffer(photo.data) ? photo.data : Buffer.from(photo.data);
      return new NextResponse(buf, { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' } });
    }

    // Fallback: serve from disk for old photos not yet migrated
    let serveFilename = photo.filename;
    if (isThumb) {
      const thumbName = `thumb_${photo.filename}`;
      const thumbPath = path.join(UPLOAD_DIR, thumbName);
      if (fs.existsSync(thumbPath)) serveFilename = thumbName;
    }

    const filePath = path.join(UPLOAD_DIR, serveFilename);
    if (!fs.existsSync(filePath)) return new NextResponse('File missing', { status: 404 });
    const buffer = fs.readFileSync(filePath);
    const ext = serveFilename.split('.').pop();
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return new NextResponse(buffer, { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' } });
  }
  const photo = await dbGet('SELECT photos.id, photos.user_id, photos.filename, photos.caption, photos.is_public, photos.created_at, users.name as author_name FROM photos JOIN users ON photos.user_id = users.id WHERE photos.id = ?', [id]);
  if (!photo) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
  return NextResponse.json({ ok: true, data: photo });
}
