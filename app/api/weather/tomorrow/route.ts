// app/api/weather/tomorrow/route.ts
import { NextResponse } from 'next/server';
import { getTodayDate, getTomorrowDate, getOrComputeDailyWeather } from '@/lib/weather';
import type { ApiResponse, Weather } from '@/lib/types';
import { apiCacheGet, apiCacheSet } from '@/lib/cache';

export async function GET() {
  const cached = apiCacheGet<{ ok: true; data: { date: string; weather: Weather } }>('weather:tomorrow');
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=60' } });
  }
  const today = getTodayDate();
  const date = getTomorrowDate();
  const todayWeather = await getOrComputeDailyWeather(today);
  const weather = await getOrComputeDailyWeather(date, todayWeather);
  const body = { ok: true, data: { date, weather } } satisfies ApiResponse<{ date: string; weather: Weather }>;
  apiCacheSet('weather:tomorrow', body, 60_000);
  return NextResponse.json(body, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
