// components/space/WeatherPicker.tsx
'use client';

import type { Weather } from '@/lib/types';

const WEATHERS: { value: Weather; label: string; emoji: string }[] = [
  { value: 'sunny', label: '晴', emoji: '☀️' },
  { value: 'cloudy', label: '多云', emoji: '☁️' },
  { value: 'light-rain', label: '小雨', emoji: '🌧' },
  { value: 'heavy-rain', label: '大雨', emoji: '⛈' },
  { value: 'fog', label: '雾', emoji: '🌫' },
  { value: 'snow', label: '雪', emoji: '❄️' },
];

interface WeatherPickerProps {
  current: Weather;
  onSelect: (w: Weather) => void;
  isOwner: boolean;
}

export default function WeatherPicker({ current, onSelect, isOwner }: WeatherPickerProps) {
  return (
    <div className="flex gap-2">
      {WEATHERS.map(w => (
        <button
          key={w.value}
          onClick={() => isOwner && onSelect(w.value)}
          disabled={!isOwner}
          className={`px-2 py-1 rounded text-sm transition-all ${
            current === w.value
              ? 'bg-white/20 text-white scale-110'
              : 'bg-white/5 text-white/40 hover:bg-white/10'
          } ${!isOwner && 'cursor-default'}`}
          title={w.label}
        >
          {w.emoji}
        </button>
      ))}
    </div>
  );
}
