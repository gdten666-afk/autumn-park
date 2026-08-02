// components/space/ScenePicker.tsx
'use client';

import type { Scene } from '@/lib/types';
import { SCENES } from '@/lib/constants';

interface ScenePickerProps {
  current: Scene;
  onSelect: (s: Scene) => void;
  isOwner: boolean;
}

export default function ScenePicker({ current, onSelect, isOwner }: ScenePickerProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {SCENES.map(s => (
        <button
          key={s.value}
          onClick={() => isOwner && onSelect(s.value)}
          disabled={!isOwner}
          className={`px-3 py-1.5 rounded-full text-xs border border-white/10 transition-all ${
            current === s.value
              ? 'bg-white/25 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          } ${!isOwner && 'cursor-default'}`}
          title={s.label}
        >
          {s.icon} {s.label}
        </button>
      ))}
    </div>
  );
}
