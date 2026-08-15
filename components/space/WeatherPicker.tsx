// components/space/WeatherPicker.tsx
'use client';

import type { Weather } from '@/lib/types';
import { WEATHERS } from '@/lib/constants';

interface WeatherPickerProps {
  current: Weather;
  onSelect: (w: Weather) => void;
  isOwner: boolean;
}

export default function WeatherPicker({ current, onSelect, isOwner }: WeatherPickerProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {WEATHERS.map(w => (
        <button
          key={w.value}
          type="button"
          aria-pressed={current === w.value}
          aria-label={w.label}
          onClick={() => isOwner && onSelect(w.value)}
          disabled={!isOwner}
          className={`px-2.5 py-1.5 rounded-lg text-sm border transition-all ${
            current === w.value
              ? 'bg-[var(--ink)] border-[var(--ink)] scale-105'
              : 'bg-[var(--surface)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]'
          } ${!isOwner && 'cursor-default'}`}
          title={w.label}
        >
          {w.emoji}
        </button>
      ))}
    </div>
  );
}
