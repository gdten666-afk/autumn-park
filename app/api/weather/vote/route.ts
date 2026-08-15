// app/api/weather/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbAll, dbGet, dbRun } from '@/lib/db';
import { getSession, requireSession } from '@/lib/auth';
import { getTodayDate, getTomorrowDate, getOrComputeDailyWeather, recomputeDailyWeather } from '@/lib/weather';
import type { ApiResponse, Weather } from '@/lib/types';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { apiCacheClear, apiCacheGet, apiCacheSet } from '@/lib/cache';

const VALID_VOTES: Weather[] = ['sunny', 'cloudy', 'light-rain', 'heavy-rain', 'fog', 'snow'];

export async function GET() {
  await ensureTables();
  const today = getTodayDate();
  const tomorrow = getTomorrowDate();
  const session = await getSession();

  interface VoteBase {
    today: Weather;
    tomorrow: Weather;
    voteDate: string;
    voteCounts: Record<string, number>;
    totalVotes: number;
  }

  let base = apiCacheGet<VoteBase>('weather:vote:base');
  if (!base) {
    const todayWeather = await getOrComputeDailyWeather(today);
    const tomorrowWeather = await getOrComputeDailyWeather(tomorrow, todayWeather);

    const voteRows = await dbAll<{ vote: string; cnt: number }>(
      'SELECT vote, COUNT(*) as cnt FROM weather_votes WHERE date = ? GROUP BY vote ORDER BY cnt DESC',
      [tomorrow]
    );

    const voteCounts: Record<string, number> = {};
    for (const vw of VALID_VOTES) voteCounts[vw] = 0;
    for (const row of voteRows) voteCounts[row.vote] = row.cnt;

    base = {
      today: todayWeather,
      tomorrow: tomorrowWeather,
      voteDate: tomorrow,
      voteCounts,
      totalVotes: Object.values(voteCounts).reduce((a: number, b: number) => a + b, 0),
    };
    apiCacheSet('weather:vote:base', base, 60_000);
  }

  // Check current user's vote
  let userVote: string | null = null;
  if (session) {
    const uv = await dbGet<{ vote: string }>('SELECT vote FROM weather_votes WHERE user_id = ? AND date = ?', [session.userId, tomorrow]);
    userVote = uv?.vote || null;
  }

  const body = {
    ok: true,
    data: {
      ...base,
      userVote,
    },
  } satisfies ApiResponse;
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-cache' } });
}

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const session = await requireSession();
    const ip = clientIp(req);
    if (!rateLimit(`vote:${ip}`, 30, 60_000)) {
      return NextResponse.json({ ok: false, error: '投票太频繁，请稍后再试' }, { status: 429 });
    }
    const { vote } = await req.json();

    if (!VALID_VOTES.includes(vote)) {
      return NextResponse.json({ ok: false, error: `Invalid vote. Must be one of: ${VALID_VOTES.join(', ')}` }, { status: 400 });
    }

    const date = getTomorrowDate();
    const todayWeather = await getOrComputeDailyWeather(getTodayDate());

    await dbRun(
      'INSERT INTO weather_votes (user_id, date, vote) VALUES (?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET vote = excluded.vote',
      [session.userId, date, vote]
    );
    await recomputeDailyWeather(date, todayWeather);
    apiCacheClear('weather:vote');
    apiCacheClear('stats');

    return NextResponse.json({ ok: true, data: { date, vote } } satisfies ApiResponse<{ date: string; vote: Weather }>);
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: 'Vote failed' }, { status: 500 });
  }
}
