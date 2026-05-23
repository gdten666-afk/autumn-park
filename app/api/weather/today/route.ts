// app/api/weather/today/route.ts
import { NextResponse } from 'next/server';
import { getTodayDate, getOrComputeDailyWeather } from '@/lib/weather';
import type { ApiResponse, Weather } from '@/lib/types';

export async function GET() {
  const date = getTodayDate();
  const weather = getOrComputeDailyWeather(date);
  return NextResponse.json({ ok: true, data: { date, weather } } satisfies ApiResponse<{ date: string; weather: Weather }>);
}
