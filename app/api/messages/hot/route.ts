// app/api/messages/hot/route.ts — 最热留言（Hero 标题）
import { NextResponse } from 'next/server';
import { ensureTables, dbGet } from '@/lib/db';
import { apiCacheGet, apiCacheSet } from '@/lib/cache';

// 16 字 + 「」引号 = 2 行内，保证 Hero 预留高度稳定（CLS 控制）
const HOT_TITLE_MAX = 16;

export async function GET() {
  const cached = apiCacheGet<{ ok: true; data: { id: string; content: string; likes: number } | null }>('messages:hot');
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'no-cache' } });

  await ensureTables();
  const row = await dbGet(
    `SELECT m.id, m.content, COUNT(ml.user_id) as likes
     FROM messages m LEFT JOIN message_likes ml ON ml.message_id = m.id
     GROUP BY m.id
     ORDER BY likes DESC, m.created_at DESC
     LIMIT 1`
  );
  let data: { id: string; content: string; likes: number } | null = null;
  if (row && Number(row.likes) > 0) {
    const content = String(row.content);
    data = {
      id: String(row.id),
      content: content.length > HOT_TITLE_MAX ? content.slice(0, HOT_TITLE_MAX) + '…' : content,
      likes: Number(row.likes),
    };
  }
  const body = { ok: true, data } as { ok: true; data: { id: string; content: string; likes: number } | null };
  apiCacheSet('messages:hot', body, 30_000);
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-cache' } });
}
