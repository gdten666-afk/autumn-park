// components/space/ScenePicker.tsx
'use client';

import type { Scene } from '@/lib/types';

const SCENES: { value: Scene; label: string; icon: string }[] = [
  { value: 'autumn-bench', label: '秋日长椅', icon: '🍂' },
  { value: 'darkroom', label: '旧房间', icon: '📷' },
  { value: 'starlit-camp', label: '星空营地', icon: '✨' },
  { value: 'lighthouse-coast', label: '海边灯塔', icon: '🗼' },
  { value: 'bookstore', label: '深夜书店', icon: '📚' },
];

interface ScenePickerProps {
  current: Scene;
  onSelect: (s: Scene) => void;
  isOwner: boolean;
}

export default function ScenePicker({ current, onSelect, isOwner }: ScenePickerProps) {
  return (
    <div className="flex gap-2">
      {SCENES.map(s => (
        <button
          key={s.value}
          onClick={() => isOwner && onSelect(s.value)}
          disabled={!isOwner}
          className={`px-3 py-1 rounded-full text-sm transition-all ${
            current === s.value
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/40 hover:bg-white/10'
          } ${!isOwner && 'cursor-default'}`}
          title={s.label}
        >
          {s.icon} {s.label}
        </button>
      ))}
    </div>
  );
}
