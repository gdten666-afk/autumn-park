import { NextResponse } from 'next/server';
import { ensureTables, dbAll, dbGet } from '@/lib/db';
import { getTodayDate } from '@/lib/weather';

export async function GET() {
  await ensureTables();
  const today = getTodayDate();

  const [userCount] = await dbAll('SELECT COUNT(*) as cnt FROM users');
  const [photoCount] = await dbAll('SELECT COUNT(*) as cnt FROM photos WHERE is_public = 1');
  const [msgCount] = await dbAll('SELECT COUNT(*) as cnt FROM messages');

  const votes = await dbAll('SELECT vote, COUNT(*) as cnt FROM weather_votes WHERE date = ? GROUP BY vote', [today]);

  const voteMap: Record<string, number> = {};
  for (const v of votes) voteMap[v.vote] = v.cnt;

  return NextResponse.json({
    ok: true, data: {
      users: userCount?.cnt || 0,
      photos: photoCount?.cnt || 0,
      messages: msgCount?.cnt || 0,
      votes: voteMap,
    }
  });
}
