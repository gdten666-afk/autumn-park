// app/api/weather/today/route.ts
import { NextResponse } from 'next/server';
import { getTodayDate, getOrComputeDailyWeather } from '@/lib/weather';
import type { ApiResponse, Weather } from '@/lib/types';
import { apiCacheGet, apiCacheSet } from '@/lib/cache';

export async function GET() {
  const cached = apiCacheGet<{ ok: true; data: { date: string; weather: Weather } }>('weather:today');
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=60' } });
  }
  const date = getTodayDate();
  const weather = await getOrComputeDailyWeather(date);
  const body = { ok: true, data: { date, weather } } satisfies ApiResponse<{ date: string; weather: Weather }>;
  apiCacheSet('weather:today', body, 60_000);
  return NextResponse.json(body, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
