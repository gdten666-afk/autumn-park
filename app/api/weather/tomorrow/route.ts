// app/api/weather/tomorrow/route.ts
import { NextResponse } from 'next/server';
import { getTomorrowDate, getOrComputeDailyWeather } from '@/lib/weather';
import type { ApiResponse, Weather } from '@/lib/types';

export async function GET() {
  const date = getTomorrowDate();
  const weather = await getOrComputeDailyWeather(date);
  return NextResponse.json({ ok: true, data: { date, weather } } satisfies ApiResponse<{ date: string; weather: Weather }>);
}
