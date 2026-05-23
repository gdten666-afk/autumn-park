// app/api/weather/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getTomorrowDate, castVote } from '@/lib/weather';
import type { ApiResponse, Weather } from '@/lib/types';

const VALID_VOTES: Weather[] = ['sunny', 'cloudy', 'light-rain', 'heavy-rain', 'fog', 'snow'];

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { vote } = await req.json();

    if (!VALID_VOTES.includes(vote)) {
      return NextResponse.json({ ok: false, error: `Invalid vote. Must be one of: ${VALID_VOTES.join(', ')}` }, { status: 400 });
    }

    const date = getTomorrowDate();
    await castVote(session.userId, date, vote);

    return NextResponse.json({ ok: true, data: { date, vote } } satisfies ApiResponse<{ date: string; vote: Weather }>);
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: 'Vote failed' }, { status: 500 });
  }
}
