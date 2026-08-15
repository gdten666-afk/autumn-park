import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { ensureTables, dbAll, dbRun } from '@/lib/db';
import { getSession, requireOperator } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { apiCacheClear, apiCacheGet, apiCacheSet } from '@/lib/cache';

const MESSAGE_COLORS = ['amber', 'rose', 'sky', 'violet', 'emerald', 'slate'];

export async function GET() {
  await ensureTables();
  const session = await getSession();
  const isOperator = session?.role === 'operator';
  // 缓存只保存原始留言（含点赞数）；likedByMe/canDelete 必须按当前请求的用户身份计算
  const cached = apiCacheGet<Record<string, unknown>[]>('messages:base');
  const messages = cached || await dbAll(
    `SELECT m.id, m.content, m.color, m.created_at,
            (SELECT COUNT(*) FROM message_likes ml WHERE ml.message_id = m.id) as likes
     FROM messages m ORDER BY m.created_at DESC LIMIT 200`
  );
  if (!cached) apiCacheSet('messages:base', messages, 10_000);

  let likedIds = new Set<string>();
  if (session) {
    const rows = await dbAll('SELECT message_id FROM message_likes WHERE user_id = ?', [session.userId]);
    likedIds = new Set(rows.map(r => String(r.message_id)));
  }

  const data = messages.map(m => ({
    ...m,
    likes: Number(m.likes ?? 0),
    likedByMe: likedIds.has(String(m.id)),
    ...(isOperator ? { canDelete: true } : {}),
  }));
  const body = { ok: true, data } satisfies ApiResponse;
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-cache' } });
}

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Login required to post messages' }, { status: 401 });
    }

    const ip = clientIp(req);
    if (!rateLimit(`message:${ip}`, 20, 60_000)) {
      return NextResponse.json({ ok: false, error: '留言太频繁，请稍后再试' }, { status: 429 });
    }

    const { content } = await req.json();
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Content is required' }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ ok: false, error: 'Message too long (max 500 chars)' }, { status: 400 });
    }

    const id = nanoid();
    const color = MESSAGE_COLORS[Math.floor(Math.random() * MESSAGE_COLORS.length)];
    await dbRun('INSERT INTO messages (id, content, color) VALUES (?, ?, ?)', [id, content.trim(), color]);
    apiCacheClear('messages:');

    const msg = { id, content: content.trim(), color, created_at: new Date().toISOString() };
    return NextResponse.json({ ok: true, data: msg } satisfies ApiResponse<typeof msg>);
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to post message' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureTables();
    await requireOperator();
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message id required' }, { status: 400 });
    }
    await dbRun('DELETE FROM messages WHERE id = ?', [id]);
    await dbRun('DELETE FROM message_likes WHERE message_id = ?', [id]);
    apiCacheClear('messages:');
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: 'Delete failed' }, { status: 500 });
  }
}
