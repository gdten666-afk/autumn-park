// lib/seasons.ts
import type { Season, SeasonState } from './types';

const SEASON_BOUNDARIES: { season: Season; start: { month: number; day: number } }[] = [
  { season: 'spring', start: { month: 3, day: 1 } },
  { season: 'summer', start: { month: 6, day: 1 } },
  { season: 'autumn', start: { month: 9, day: 1 } },
  { season: 'winter', start: { month: 12, day: 1 } },
];

const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function seasonBoundaryDayOfYear(season: Season, year: number): number {
  const boundary = SEASON_BOUNDARIES.find(s => s.season === season)!;
  return dayOfYear(new Date(year, boundary.start.month - 1, boundary.start.day));
}

export function getSeasonState(date: Date = new Date()): SeasonState {
  const doy = dayOfYear(date);
  const year = date.getFullYear();

  // Find current season
  let currentSeason: Season = 'winter';
  let nextSeason: Season = 'spring';

  const boundaries = SEASON_ORDER.map(s => ({
    season: s,
    doy: seasonBoundaryDayOfYear(s, year),
  }));

  // Sort by day of year
  for (let i = boundaries.length - 1; i >= 0; i--) {
    if (doy >= boundaries[i].doy) {
      currentSeason = boundaries[i].season;
      nextSeason = boundaries[(i + 1) % 4].season;
      break;
    }
  }

  const currentBoundary = boundaries.find(b => b.season === currentSeason)!.doy;
  const nextBoundaryDoy = boundaries.find(b => b.season === nextSeason)!.doy;

  // If next boundary is in the next calendar year
  const effectiveNextDoy = nextBoundaryDoy < currentBoundary
    ? nextBoundaryDoy + (isLeapYear(year) ? 366 : 365)
    : nextBoundaryDoy;

  const effectiveDoy = doy < currentBoundary ? doy + (isLeapYear(year) ? 366 : 365) : doy;
  const effectiveStart = effectiveNextDoy - 7;

  const transitionWeight = computeTransitionWeight(effectiveDoy, effectiveStart);

  return {
    season: currentSeason,
    transitionWeight,
    secondarySeason: transitionWeight > 0 ? nextSeason : null,
  };
}

function computeTransitionWeight(doy: number, start: number): number {
  const TRANSITION_DAYS = 14;
  const mid = start + 7;

  if (doy < start) return 0;
  if (doy > start + TRANSITION_DAYS) return 0;

  const distFromMid = Math.abs(doy - mid);
  return Math.max(0, 1 - distFromMid / 7);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export const SEASON_COLORS: Record<Season, { bg: string; accent: string; particle: string }> = {
  spring: { bg: '#e8f5e9', accent: '#f8bbd0', particle: '#fce4ec' },
  summer: { bg: '#1b5e20', accent: '#ffd54f', particle: '#fff9c4' },
  autumn: { bg: '#3e2723', accent: '#ff8f00', particle: '#ffcc02' },
  winter: { bg: '#eceff1', accent: '#90caf9', particle: '#e3f2fd' },
};
