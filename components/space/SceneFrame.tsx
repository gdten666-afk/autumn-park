// components/space/SceneFrame.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { Scene, Weather } from '@/lib/types';
import { createParticle, createParticleEngine, SEASON_PARTICLES } from '@/lib/particles';
import type { Particle } from '@/lib/particles';

const SCENE_STYLES: Record<Scene, { bg: string; gradient: string }> = {
  'autumn-bench':    { bg: '#f3ece0', gradient: 'linear-gradient(180deg, #f7f1e6 0%, #f1e9db 55%, #e9dfcc 100%)' },
  'darkroom':        { bg: '#eceae4', gradient: 'linear-gradient(180deg, #f1efe9 0%, #e9e7df 55%, #dedbd1 100%)' },
  'starlit-camp':    { bg: '#e6eaf0', gradient: 'linear-gradient(180deg, #eceff4 0%, #e2e7ef 55%, #d6dde8 100%)' },
  'lighthouse-coast':{ bg: '#e5ebef', gradient: 'linear-gradient(180deg, #edf1f4 0%, #e3eaee 55%, #d6e0e6 100%)' },
  'bookstore':       { bg: '#f0e9dc', gradient: 'linear-gradient(180deg, #f5efe3 0%, #ede5d5 55%, #e4dac6 100%)' },
};

const SCENE_LABELS: Record<Scene, string> = {
  'autumn-bench': '秋日长椅',
  'darkroom': '旧房间',
  'starlit-camp': '星空营地',
  'lighthouse-coast': '海边灯塔',
  'bookstore': '深夜书店',
};

// --- 角落天气粒子（复用统一引擎） ---

function WeatherParticles({ weather }: { weather: Weather }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (weather !== 'light-rain' && weather !== 'heavy-rain' && weather !== 'snow') return;

    const engine = createParticleEngine(canvas);
    const isRain = weather === 'light-rain' || weather === 'heavy-rain';
    const heavy = weather === 'heavy-rain';

    const build = (w: number, h: number): Particle[] => {
      if (isRain) {
        const count = heavy ? 200 : 100;
        return Array.from({ length: count }, () => {
          const p = createParticle(w, h, SEASON_PARTICLES.autumn, {
            type: 'raindrop', density: heavy ? 2.2 : 1.0,
            speedMult: heavy ? 3.5 : 2.5, sizeMult: heavy ? 1.3 : 1.0,
          });
          p.length = (heavy ? 15 + Math.random() * 25 : 10 + Math.random() * 18) * 0.6;
          p.opacity = heavy ? 0.4 + Math.random() * 0.35 : 0.3 + Math.random() * 0.3;
          return p;
        });
      }
      return Array.from({ length: 100 }, () => {
        const p = createParticle(w, h, SEASON_PARTICLES.winter, null);
        p.size = 1.5 + Math.random() * 3;
        p.opacity = 0.5 + Math.random() * 0.5;
        return p;
      });
    };

    engine.rebuild(build);
    engine.start();
    return () => engine.stop();
  }, [weather]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 9 }} />;
}

// --- SceneFrame ---

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
      {/* Weather particles canvas (rain / snow) */}
      <WeatherParticles weather={weather} />

      {/* Weather atmosphere overlays — all pointer-events-none */}
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

        {/* Rain: soft blue-grey atmosphere on paper */}
        {(weather === 'light-rain' || weather === 'heavy-rain') && (
          <div className="absolute inset-0" style={{
            background: weather === 'heavy-rain'
              ? 'linear-gradient(180deg, rgba(80,95,120,0.22) 0%, rgba(95,110,135,0.18) 50%, rgba(110,125,150,0.15) 100%)'
              : 'linear-gradient(180deg, rgba(100,115,140,0.12) 0%, rgba(115,130,150,0.1) 50%, rgba(130,145,165,0.08) 100%)',
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
