'use client';

import type { SeasonState, Weather } from '@/lib/types';

interface ParkSceneProps { seasonState: SeasonState; weather: Weather; }

export default function ParkScene({ seasonState, weather }: ParkSceneProps) {
  const season = seasonState.season;

  const palette: Record<string, { sky: string; ground: string; accent: string; rays: string }> = {
    spring: { sky: 'linear-gradient(180deg, #d4eaf7 0%, #e8f2fa 40%, #f5f0e8 100%)', ground: 'linear-gradient(0deg, rgba(180,165,140,0.7) 0%, rgba(200,185,160,0.4) 40%, transparent 100%)', accent: 'rgba(140,200,160,0.06)', rays: 'rgba(255,250,240,0.15)' },
    summer: { sky: 'linear-gradient(180deg, #b8daf5 0%, #dce8f0 40%, #f0ebe0 100%)', ground: 'linear-gradient(0deg, rgba(160,150,120,0.7) 0%, rgba(190,175,145,0.4) 40%, transparent 100%)', accent: 'rgba(120,180,140,0.08)', rays: 'rgba(255,245,220,0.2)' },
    autumn: { sky: 'linear-gradient(180deg, #d4c8b8 0%, #e8ddd0 40%, #f2e8d8 100%)', ground: 'linear-gradient(0deg, rgba(150,120,80,0.7) 0%, rgba(180,150,110,0.4) 40%, transparent 100%)', accent: 'rgba(200,140,80,0.08)', rays: 'rgba(255,230,190,0.12)' },
    winter: { sky: 'linear-gradient(180deg, #c8d4e0 0%, #dce4ed 40%, #eef0f4 100%)', ground: 'linear-gradient(0deg, rgba(160,165,175,0.6) 0%, rgba(190,195,205,0.35) 40%, transparent 100%)', accent: 'rgba(150,160,180,0.05)', rays: 'rgba(240,240,250,0.08)' },
  };
  const c = palette[season] || palette.spring;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Sky */}
      <div className="absolute inset-0" style={{ background: c.sky, zIndex: 0 }} />

      {/* Sunny: bright warm glow + sun */}
      {weather === 'sunny' && (
        <>
          <div className="absolute" style={{
            top: '5%', left: '55%',
            width: 'clamp(120px, 20vw, 280px)', height: 'clamp(120px, 20vw, 280px)',
            background: 'radial-gradient(circle, rgba(255,240,200,0.7) 0%, rgba(255,220,150,0.3) 30%, rgba(255,200,100,0.05) 60%, transparent 75%)',
            borderRadius: '50%', zIndex: 2,
            animation: 'sunPulse 8s ease-in-out infinite',
          }} />
          <div className="absolute inset-0" style={{
            zIndex: 3,
            background: 'linear-gradient(180deg, rgba(255,240,210,0.25) 0%, rgba(255,250,240,0.1) 40%, transparent 70%)',
          }} />
          {/* Light rays */}
          <div className="absolute inset-0" style={{
            zIndex: 4,
            background: `radial-gradient(ellipse 60% 40% at 55% 5%, rgba(255,250,220,0.4) 0%, transparent 55%)`,
            animation: 'godRays 12s ease-in-out infinite',
          }} />
        </>
      )}

      {/* Cloudy: grey cast, muted light */}
      {weather === 'cloudy' && (
        <>
          <div className="absolute inset-0" style={{
            zIndex: 3,
            background: 'linear-gradient(180deg, rgba(180,180,190,0.35) 0%, rgba(200,200,210,0.25) 40%, rgba(220,220,225,0.15) 100%)',
          }} />
          <div className="absolute inset-0" style={{
            zIndex: 4,
            background: 'radial-gradient(ellipse 70% 30% at 40% 10%, rgba(220,220,230,0.3) 0%, transparent 60%)',
            animation: 'cloudDrift 20s ease-in-out infinite',
          }} />
        </>
      )}

      {/* Rain: dark blue-grey atmosphere overlay (rain streaks via ParticleOverlay canvas) */}
      {(weather === 'light-rain' || weather === 'heavy-rain') && (
        <div className="absolute inset-0" style={{
          zIndex: 3,
          background: weather === 'heavy-rain'
            ? 'linear-gradient(180deg, rgba(40,50,70,0.5) 0%, rgba(50,60,80,0.45) 50%, rgba(60,70,90,0.4) 100%)'
            : 'linear-gradient(180deg, rgba(60,70,90,0.3) 0%, rgba(80,90,110,0.25) 50%, rgba(100,110,120,0.2) 100%)',
        }} />
      )}

      {/* Snow: white frost overlay */}
      {weather === 'snow' && (
        <>
          <div className="absolute inset-0" style={{
            zIndex: 3,
            background: 'linear-gradient(180deg, rgba(220,225,235,0.35) 0%, rgba(235,240,248,0.3) 50%, rgba(245,248,252,0.25) 100%)',
          }} />
          <div className="absolute inset-0" style={{
            zIndex: 4,
            background: 'radial-gradient(ellipse 50% 20% at 50% 5%, rgba(255,255,255,0.4) 0%, transparent 60%)',
          }} />
        </>
      )}

      {/* Fog: heavy white mist + blur */}
      {weather === 'fog' && (
        <>
          <div className="absolute inset-0" style={{
            zIndex: 3,
            background: 'linear-gradient(180deg, rgba(210,215,220,0.45) 0%, rgba(220,225,230,0.4) 50%, rgba(230,235,240,0.35) 100%)',
            backdropFilter: 'blur(4px)',
          }} />
          <div className="absolute inset-0" style={{
            zIndex: 4,
            background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(240,242,245,0.5) 0%, transparent 70%)',
            animation: 'fogDrift 16s ease-in-out infinite',
          }} />
        </>
      )}

      {/* Subtle atmosphere texture */}
      <div className="absolute inset-0" style={{ zIndex: 1, opacity: 0.06, background: 'url(/assets/scene/misty-trees.jpg) center/cover no-repeat', filter: 'brightness(1.5) blur(1px)' }} />

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '30vh', zIndex: 2, background: c.ground }} />

      {/* Season accent */}
      <div className="absolute inset-0" style={{ zIndex: 3, background: c.accent, transition: 'background 4s ease' }} />

      {/* Subtle vignette */}
      <div className="absolute inset-0" style={{ zIndex: 5, background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.06) 100%)' }} />
    </div>
  );
}
