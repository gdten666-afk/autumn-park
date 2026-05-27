// lib/weather.ts
import { dbGet, dbAll, dbRun } from './db';
import type { Weather } from './types';

const WEATHER_PRIORITY: Weather[] = ['sunny', 'cloudy', 'light-rain', 'fog', 'heavy-rain', 'snow'];

export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function countWinner(votes: any[], fallback: Weather): Weather {
  if (votes.length === 0) return fallback;
  const maxCnt = votes[0].cnt;
  const topVotes = votes.filter((v: any) => v.cnt === maxCnt).map((v: any) => v.vote);
  return WEATHER_PRIORITY.find(w => topVotes.includes(w)) || fallback;
}

export async function getOrComputeDailyWeather(date: string, fallback: Weather = 'sunny'): Promise<Weather> {
  const existing = await dbGet('SELECT weather FROM daily_weather WHERE date = ?', [date]);
  if (existing) return existing.weather as Weather;

  const votes = await dbAll('SELECT vote, COUNT(*) as cnt FROM weather_votes WHERE date = ? GROUP BY vote ORDER BY cnt DESC', [date]);
  const weather = countWinner(votes, fallback);

  await dbRun('INSERT OR IGNORE INTO daily_weather (date, weather) VALUES (?, ?)', [date, weather]);
  return weather;
}

export async function recomputeDailyWeather(date: string, fallback: Weather = 'sunny'): Promise<Weather> {
  const votes = await dbAll('SELECT vote, COUNT(*) as cnt FROM weather_votes WHERE date = ? GROUP BY vote ORDER BY cnt DESC', [date]);
  const weather = countWinner(votes, fallback);
  await dbRun('INSERT OR REPLACE INTO daily_weather (date, weather) VALUES (?, ?)', [date, weather]);
  return weather;
}

export async function castVote(userId: string, date: string, vote: Weather): Promise<{ ok: boolean; error?: string }> {
  await dbRun(
    'INSERT INTO weather_votes (user_id, date, vote) VALUES (?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET vote = excluded.vote',
    [userId, date, vote]
  );
  return { ok: true };
}

export const WEATHER_EFFECTS: Record<Weather, { particles: string; opacity: number; speed: number }> = {
  'sunny':       { particles: 'light-rays', opacity: 0.3, speed: 0.2 },
  'cloudy':      { particles: 'none',       opacity: 0.6, speed: 0.5 },
  'light-rain':  { particles: 'rain',       opacity: 0.4, speed: 1.0 },
  'heavy-rain':  { particles: 'rain',       opacity: 0.8, speed: 1.5 },
  'fog':         { particles: 'fog',        opacity: 0.5, speed: 0.1 },
  'snow':        { particles: 'snow',       opacity: 0.6, speed: 0.3 },
};
