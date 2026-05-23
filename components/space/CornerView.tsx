// components/space/CornerView.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import SceneFrame from './SceneFrame';
import WeatherPicker from './WeatherPicker';
import ScenePicker from './ScenePicker';
import PhotoWall from './PhotoWall';
import type { Space } from '@/lib/types';

interface CornerViewProps {
  userId: string;
  isOwner: boolean;
  onExit: () => void;
}

export default function CornerView({ userId, isOwner, onExit }: CornerViewProps) {
  const [space, setSpace] = useState<Space | null>(null);

  useEffect(() => {
    fetch(`/api/space/${userId}`)
      .then(r => r.json())
      .then(data => { if (data.ok) setSpace(data.data); });
  }, [userId]);

  const updateSpace = useCallback(async (update: Partial<Pick<Space, 'scene' | 'weather'>>) => {
    const res = await fetch('/api/space', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const data = await res.json();
    if (data.ok) setSpace(data.data);
  }, []);

  if (!space) {
    return (
      <div className="fixed inset-0 z-30 bg-black flex items-center justify-center">
        <p className="text-white/40">正在进入这个角落...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30">
      <SceneFrame scene={space.scene} weather={space.weather}>
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
          <button
            onClick={onExit}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm text-white/70 transition-colors"
          >
            ← 回到公园
          </button>

          <div className="flex items-center gap-4">
            <WeatherPicker current={space.weather} onSelect={w => updateSpace({ weather: w })} isOwner={isOwner} />
            <ScenePicker current={space.scene} onSelect={s => updateSpace({ scene: s })} isOwner={isOwner} />
          </div>

          <p className="text-white/40 text-sm">
            {space.owner_name} 的角落
          </p>
        </div>

        <div className="pt-16 h-full overflow-y-auto">
          <PhotoWall userId={userId} isOwner={isOwner} scene={space.scene} />
        </div>
      </SceneFrame>
    </div>
  );
}
