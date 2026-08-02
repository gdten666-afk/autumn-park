import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { ensureTables, dbAll, dbRun } from '@/lib/db';
import { getSession, requireSession } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { dbGet } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  await ensureTables();
  const { photoId } = await params;
  const photo = await dbGet('SELECT is_public, user_id FROM photos WHERE id = ?', [photoId]);
  if (!photo) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
  if (!photo.is_public) {
    const session = await getSession();
    if (!session || (session.userId !== photo.user_id && session.role !== 'operator')) {
      return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
    }
  }
  const comments = await dbAll(
    `SELECT c.id, c.photo_id, c.user_id, c.content, c.created_at, u.name as author_name
     FROM photo_comments c JOIN users u ON c.user_id = u.id
     WHERE c.photo_id = ? ORDER BY c.created_at ASC`,
    [photoId]
  );
  return NextResponse.json({ ok: true, data: comments } satisfies ApiResponse);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    await ensureTables();
    const session = await requireSession();
    const ip = clientIp(req);
    if (!rateLimit(`comment:${ip}`, 30, 60_000)) {
      return NextResponse.json({ ok: false, error: '评论太频繁，请稍后再试' }, { status: 429 });
    }
    const { photoId } = await params;
    const { content } = await req.json();

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ ok: false, error: '请输入评论内容' }, { status: 400 });
    }
    if (content.length > 300) {
      return NextResponse.json({ ok: false, error: '评论最多300字' }, { status: 400 });
    }

    const id = nanoid();
    await dbRun(
      'INSERT INTO photo_comments (id, photo_id, user_id, content) VALUES (?, ?, ?, ?)',
      [id, photoId, session.userId, content.trim()]
    );

    const comment = {
      id, photo_id: photoId, user_id: session.userId,
      content: content.trim(), created_at: new Date().toISOString(),
      author_name: session.name,
    };
    return NextResponse.json({ ok: true, data: comment } satisfies ApiResponse);
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    await ensureTables();
    const session = await requireSession();
    const { photoId } = await params;
    const { commentId } = await req.json();

    const comment = await dbAll(
      'SELECT id, user_id FROM photo_comments WHERE id = ? AND photo_id = ?',
      [commentId, photoId]
    );
    if (!comment.length) {
      return NextResponse.json({ ok: false, error: 'Comment not found' }, { status: 404 });
    }
    if (comment[0].user_id !== session.userId && session.role !== 'operator') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbRun('DELETE FROM photo_comments WHERE id = ?', [commentId]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: 'Delete failed' }, { status: 500 });
  }
}
