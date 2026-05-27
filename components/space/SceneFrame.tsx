// components/space/SceneFrame.tsx
'use client';

import type { Scene, Weather } from '@/lib/types';

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
  weather: Weather;
  children: React.ReactNode;
}

export default function SceneFrame({ scene, weather, children }: SceneFrameProps) {
  const style = SCENE_STYLES[scene];

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: style.gradient }}
    >
      {/* === Weather effects — all pointer-events-none so they don't block clicks === */}
      <div className="absolute inset-0 z-10 pointer-events-none">

        {/* Sunny: warm glow + light rays */}
        {weather === 'sunny' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-100/15 via-amber-50/5 to-transparent" />
            <div className="absolute" style={{
              top: '3%', right: '10%',
              width: 'clamp(80px, 15vw, 200px)', height: 'clamp(80px, 15vw, 200px)',
              background: 'radial-gradient(circle, rgba(255,240,200,0.3) 0%, rgba(255,220,150,0.1) 30%, transparent 65%)',
              borderRadius: '50%',
              animation: 'sunPulse 8s ease-in-out infinite',
            }} />
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse 50% 30% at 60% 5%, rgba(255,250,220,0.25) 0%, transparent 55%)',
              animation: 'godRays 12s ease-in-out infinite',
            }} />
          </>
        )}

        {/* Cloudy: grey overcast */}
        {weather === 'cloudy' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-400/20 via-gray-500/10 to-transparent" />
            <div className="absolute top-[2%] left-[10%] w-[40vw] h-[10vh] bg-gray-300/15 rounded-full blur-3xl" />
            <div className="absolute top-[6%] right-[5%] w-[35vw] h-[8vh] bg-gray-400/12 rounded-full blur-2xl" />
          </>
        )}

        {/* Rain: dark blue-grey atmosphere (rain streaks via ParticleOverlay canvas) */}
        {(weather === 'light-rain' || weather === 'heavy-rain') && (
          <div className="absolute inset-0" style={{
            background: weather === 'heavy-rain'
              ? 'linear-gradient(180deg, rgba(20,30,50,0.55) 0%, rgba(30,40,60,0.5) 50%, rgba(40,50,70,0.45) 100%)'
              : 'linear-gradient(180deg, rgba(30,40,60,0.3) 0%, rgba(40,50,70,0.25) 50%, rgba(50,60,80,0.2) 100%)',
          }} />
        )}

        {/* Snow: white frost + glow */}
        {weather === 'snow' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-white/8" />
            <div className="absolute top-[2%] left-[30%] w-[40vw] h-[8vh] bg-white/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 h-[4vh] bg-white/10 blur-md" />
          </>
        )}

        {/* Fog: heavy blur + drifting mist */}
        {weather === 'fog' && (
          <>
            <div className="absolute inset-0 bg-white/15 backdrop-blur-[3px]" />
            <div className="absolute top-[8%] left-[5%] w-[45vw] h-[18vh] bg-white/20 rounded-full blur-3xl"
              style={{ animation: 'fogDrift 14s ease-in-out infinite' }} />
            <div className="absolute top-[25%] right-[10%] w-[40vw] h-[15vh] bg-white/15 rounded-full blur-3xl"
              style={{ animation: 'fogDrift 18s ease-in-out infinite reverse' }} />
            <div className="absolute top-[45%] left-[20%] w-[50vw] h-[12vh] bg-white/10 rounded-full blur-2xl"
              style={{ animation: 'fogDrift 16s ease-in-out infinite' }} />
          </>
        )}

        {/* Subtle vignette */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.12) 100%)' }} />

      </div>

      {children}
    </div>
  );
}

export { SCENE_STYLES, SCENE_LABELS };
