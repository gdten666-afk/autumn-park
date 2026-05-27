// app/api/weather/tomorrow/route.ts
import { NextResponse } from 'next/server';
import { getTodayDate, getTomorrowDate, getOrComputeDailyWeather } from '@/lib/weather';
import type { ApiResponse, Weather } from '@/lib/types';

export async function GET() {
  const today = getTodayDate();
  const date = getTomorrowDate();
  const todayWeather = await getOrComputeDailyWeather(today);
  const weather = await getOrComputeDailyWeather(date, todayWeather);
  return NextResponse.json({ ok: true, data: { date, weather } } satisfies ApiResponse<{ date: string; weather: Weather }>);
}
