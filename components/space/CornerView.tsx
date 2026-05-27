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
        <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-between gap-3 max-md:flex-col max-md:gap-2 max-md:items-start">
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={onExit} className="glass-btn shrink-0 text-xs !px-3 !py-1">
              ← 回到公园
            </button>
            <div className="glass px-2 py-1 shrink-0 max-md:hidden">
              <p className="text-white/40 text-xs">
                <span className="text-white/60">{space.owner_name}</span> 的角落
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 max-md:gap-1 max-md:flex-wrap max-md:w-full">
            <WeatherPicker current={space.weather} onSelect={w => updateSpace({ weather: w })} isOwner={isOwner} />
            <ScenePicker current={space.scene} onSelect={s => updateSpace({ scene: s })} isOwner={isOwner} />
          </div>
        </div>

        <div className="pt-16 h-full overflow-y-auto">
          <PhotoWall userId={userId} isOwner={isOwner} scene={space.scene} />
        </div>
      </SceneFrame>
    </div>
  );
}
