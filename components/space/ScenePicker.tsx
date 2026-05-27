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
    <div className="flex gap-1 max-md:gap-0.5 flex-wrap">
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
