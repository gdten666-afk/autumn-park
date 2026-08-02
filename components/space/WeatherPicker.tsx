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
          onClick={() => isOwner && onSelect(w.value)}
          disabled={!isOwner}
          className={`px-2.5 py-1.5 rounded-lg text-sm border border-white/10 transition-all ${
            current === w.value
              ? 'bg-white/25 text-white scale-110'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          } ${!isOwner && 'cursor-default'}`}
          title={w.label}
        >
          {w.emoji}
        </button>
      ))}
    </div>
  );
}
