// lib/weather.ts
import { getDb } from './db';
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

export function getOrComputeDailyWeather(date: string): Weather {
  const db = getDb();
  const existing = db.prepare('SELECT weather FROM daily_weather WHERE date = ?').get(date) as any;
  if (existing) return existing.weather;

  // Try to tally votes for this date
  const votes = db.prepare('SELECT vote, COUNT(*) as cnt FROM weather_votes WHERE date = ? GROUP BY vote ORDER BY cnt DESC').all(date) as any[];

  let weather: Weather = 'sunny';
  if (votes.length > 0) {
    const maxCnt = votes[0].cnt;
    const topVotes = votes.filter((v: any) => v.cnt === maxCnt).map((v: any) => v.vote);
    weather = WEATHER_PRIORITY.find(w => topVotes.includes(w)) || 'sunny';
  }

  db.prepare('INSERT OR IGNORE INTO daily_weather (date, weather) VALUES (?, ?)').run(date, weather);
  return weather;
}

export function castVote(userId: string, date: string, vote: Weather): { ok: boolean; error?: string } {
  const db = getDb();

  // Upsert
  db.prepare(
    'INSERT INTO weather_votes (user_id, date, vote) VALUES (?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET vote = excluded.vote'
  ).run(userId, date, vote);

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
