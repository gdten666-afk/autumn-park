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
      {/* === Weather effects — mirror the park visuals === */}

      {/* Sunny: warm glow + light rays */}
      {weather === 'sunny' && (
        <>
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-yellow-100/15 via-amber-50/5 to-transparent" />
          <div className="absolute z-10" style={{
            top: '3%', right: '10%',
            width: 'clamp(80px, 15vw, 200px)', height: 'clamp(80px, 15vw, 200px)',
            background: 'radial-gradient(circle, rgba(255,240,200,0.3) 0%, rgba(255,220,150,0.1) 30%, transparent 65%)',
            borderRadius: '50%',
            animation: 'sunPulse 8s ease-in-out infinite',
          }} />
          <div className="absolute inset-0 z-10" style={{
            background: 'radial-gradient(ellipse 50% 30% at 60% 5%, rgba(255,250,220,0.25) 0%, transparent 55%)',
            animation: 'godRays 12s ease-in-out infinite',
          }} />
        </>
      )}

      {/* Cloudy: grey overcast */}
      {weather === 'cloudy' && (
        <>
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-gray-400/20 via-gray-500/10 to-transparent" />
          <div className="absolute top-[2%] left-[10%] w-[40vw] h-[10vh] bg-gray-300/15 rounded-full blur-3xl z-10" />
          <div className="absolute top-[6%] right-[5%] w-[35vw] h-[8vh] bg-gray-400/12 rounded-full blur-2xl z-10" />
        </>
      )}

      {/* Rain: dark blue-grey + rain streaks */}
      {(weather === 'light-rain' || weather === 'heavy-rain') && (
        <>
          <div className="absolute inset-0 z-10" style={{
            background: weather === 'heavy-rain'
              ? 'linear-gradient(180deg, rgba(20,30,50,0.55) 0%, rgba(30,40,60,0.5) 50%, rgba(40,50,70,0.45) 100%)'
              : 'linear-gradient(180deg, rgba(30,40,60,0.3) 0%, rgba(40,50,70,0.25) 50%, rgba(50,60,80,0.2) 100%)',
          }} />
          <div className="absolute inset-0 overflow-hidden z-10">
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `repeating-linear-gradient(
                5deg, transparent, transparent 2px,
                rgba(150,180,210,0.2) 2px, rgba(150,180,210,0.2) 3px
              )`,
              backgroundSize: weather === 'heavy-rain' ? '100% 18px' : '100% 30px',
              animation: `rainFall ${weather === 'heavy-rain' ? '0.35s' : '0.6s'} linear infinite`,
            }} />
          </div>
        </>
      )}

      {/* Snow: white frost + glow */}
      {weather === 'snow' && (
        <>
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/10 via-white/5 to-white/8" />
          <div className="absolute top-[2%] left-[30%] w-[40vw] h-[8vh] bg-white/15 rounded-full blur-3xl z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-[4vh] bg-white/10 blur-md z-10" />
        </>
      )}

      {/* Fog: heavy blur + drifting mist */}
      {weather === 'fog' && (
        <>
          <div className="absolute inset-0 z-10 bg-white/15 backdrop-blur-[3px]" />
          <div className="absolute top-[8%] left-[5%] w-[45vw] h-[18vh] bg-white/20 rounded-full blur-3xl z-10"
            style={{ animation: 'fogDrift 14s ease-in-out infinite' }} />
          <div className="absolute top-[25%] right-[10%] w-[40vw] h-[15vh] bg-white/15 rounded-full blur-3xl z-10"
            style={{ animation: 'fogDrift 18s ease-in-out infinite reverse' }} />
          <div className="absolute top-[45%] left-[20%] w-[50vw] h-[12vh] bg-white/10 rounded-full blur-2xl z-10"
            style={{ animation: 'fogDrift 16s ease-in-out infinite' }} />
        </>
      )}

      {/* Subtle vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.12) 100%)' }} />

      {children}
    </div>
  );
}

export { SCENE_STYLES, SCENE_LABELS };
