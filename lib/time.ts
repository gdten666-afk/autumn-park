// lib/time.ts — Time-of-day utilities for day/night cycle
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'evening';
  return 'night';
}

export function getTimeProgress(tod: TimeOfDay, hours?: number): number {
  const h = hours === undefined
    ? new Date().getHours() + new Date().getMinutes() / 60
    : hours;
  switch (tod) {
    case 'morning': return (h - 5) / 5;   // 0→1 over 5h
    case 'day': return (h - 10) / 7;       // 0→1 over 7h
    case 'evening': return (h - 17) / 3;   // 0→1 over 3h
    case 'night': {
      if (h >= 20) return (h - 20) / 9;    // 0→1 over 9h
      return (h + 4) / 9;                   // wrap around
    }
  }
}

export const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: '清晨',
  day: '白昼',
  evening: '黄昏',
  night: '夜晚',
};
