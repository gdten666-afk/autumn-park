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

      {/* Subtle atmosphere */}
      <div className="absolute inset-0" style={{ zIndex: 1, opacity: 0.06, background: 'url(/assets/scene/misty-trees.jpg) center/cover no-repeat', filter: 'brightness(1.5) blur(1px)' }} />

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '30vh', zIndex: 2, background: c.ground }} />

      {/* Season accent */}
      <div className="absolute inset-0" style={{ zIndex: 3, background: c.accent, transition: 'background 4s ease' }} />

      {/* Light rays */}
      <div className="absolute inset-0" style={{ zIndex: 4, background: `radial-gradient(ellipse 50% 30% at 45% 5%, ${c.rays} 0%, transparent 55%)`, animation: 'godRays 18s ease-in-out infinite' }} />

      {/* Subtle vignette */}
      <div className="absolute inset-0" style={{ zIndex: 5, background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.08) 100%)' }} />

      {/* Weather */}
      {weather === 'fog' && <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] z-10" />}
      {weather === 'light-rain' && <div className="absolute inset-0 bg-white/15 z-10" />}
      {weather === 'heavy-rain' && <div className="absolute inset-0 bg-white/25 z-10" />}
    </div>
  );
}
