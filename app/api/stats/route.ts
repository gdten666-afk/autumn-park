import { NextResponse } from 'next/server';
import { ensureTables, dbAll } from '@/lib/db';
import { getTodayDate } from '@/lib/weather';
import { apiCacheGet, apiCacheSet } from '@/lib/cache';

export async function GET() {
  const cached = apiCacheGet<{ ok: true; data: unknown }>('stats');
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=30' } });
  }
  await ensureTables();
  const today = getTodayDate();

  const [userCount] = await dbAll('SELECT COUNT(*) as cnt FROM users');
  const [photoCount] = await dbAll('SELECT COUNT(*) as cnt FROM photos WHERE is_public = 1');
  const [msgCount] = await dbAll('SELECT COUNT(*) as cnt FROM messages');

  const votes = await dbAll('SELECT vote, COUNT(*) as cnt FROM weather_votes WHERE date = ? GROUP BY vote', [today]);

  const voteMap: Record<string, number> = {};
  for (const v of votes) voteMap[v.vote] = v.cnt;

  const body = {
    ok: true, data: {
      users: userCount?.cnt || 0,
      photos: photoCount?.cnt || 0,
      messages: msgCount?.cnt || 0,
      votes: voteMap,
    }
  };
  apiCacheSet('stats', body, 30_000);
  return NextResponse.json(body, { headers: { 'Cache-Control': 'public, max-age=30' } });
}
