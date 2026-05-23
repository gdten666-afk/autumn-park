// components/space/SceneFrame.tsx
'use client';

import type { Scene } from '@/lib/types';

const SCENE_STYLES: Record<Scene, { bg: string; gradient: string }> = {
  'autumn-bench':    { bg: '#3e2723', gradient: 'linear-gradient(180deg, #4e342e 0%, #3e2723 40%, #2c1810 100%)' },
  'darkroom':        { bg: '#1a1a1a', gradient: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)' },
  'starlit-camp':    { bg: '#0d1b2a', gradient: 'linear-gradient(180deg, #0d1b2a 0%, #1b2838 60%, #1a1110 100%)' },
  'lighthouse-coast':{ bg: '#1a237e', gradient: 'linear-gradient(180deg, #1a237e 0%, #283593 50%, #0d1b2a 100%)' },
  'bookstore':       { bg: '#3e2723', gradient: 'linear-gradient(180deg, #4e342e 0%, #3e2723 60%, #2c1810 100%)' },
};

const SCENE_LABELS: Record<Scene, string> = {
  'autumn-bench': '秋日长椅',
  'darkroom': '旧房间',
  'starlit-camp': '星空营地',
  'lighthouse-coast': '海边灯塔',
  'bookstore': '深夜书店',
};

interface SceneFrameProps {
  scene: Scene;
  weather: string;
  children: React.ReactNode;
}

export default function SceneFrame({ scene, weather, children }: SceneFrameProps) {
  const style = SCENE_STYLES[scene];

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: style.gradient }}
    >
      {/* Weather filter overlay */}
      {weather === 'fog' && <div className="absolute inset-0 z-10 bg-white/10 backdrop-blur-sm" />}
      {weather === 'cloudy' && <div className="absolute inset-0 z-10 bg-black/20" />}

      {children}
    </div>
  );
}

export { SCENE_STYLES, SCENE_LABELS };
