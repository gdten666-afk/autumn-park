// app/api/messages/like/route.ts — 点赞 toggle
import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbGet, dbRun, dbAll } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { apiCacheClear } from '@/lib/cache';

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const session = await requireSession();
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message id required' }, { status: 400 });
    }
    const msg = await dbGet('SELECT id FROM messages WHERE id = ?', [id]);
    if (!msg) return NextResponse.json({ ok: false, error: 'Message not found' }, { status: 404 });

    const existing = await dbGet('SELECT 1 as x FROM message_likes WHERE message_id = ? AND user_id = ?', [id, session.userId]);
    let liked: boolean;
    if (existing) {
      await dbRun('DELETE FROM message_likes WHERE message_id = ? AND user_id = ?', [id, session.userId]);
      liked = false;
    } else {
      await dbRun('INSERT INTO message_likes (message_id, user_id) VALUES (?, ?)', [id, session.userId]);
      liked = true;
    }
    const [cnt] = await dbAll('SELECT COUNT(*) as cnt FROM message_likes WHERE message_id = ?', [id]);
    apiCacheClear('messages:');
    return NextResponse.json({ ok: true, data: { id, liked, likes: Number(cnt?.cnt ?? 0) } });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: 'Failed to like' }, { status: 500 });
  }
}
