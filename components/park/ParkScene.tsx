'use client';

import type { SeasonState, Weather } from '@/lib/types';

interface ParkSceneProps {
  seasonState: SeasonState;
  weather: Weather;
}

export default function ParkScene({ seasonState, weather }: ParkSceneProps) {
  const season = seasonState.season;

  const palette: Record<string, { sky1: string; sky2: string; accent: string }> = {
    spring: { sky1: '#1a2a1e', sky2: '#162018', accent: 'rgba(102,187,106,0.06)' },
    summer: { sky1: '#121a15', sky2: '#0d1410', accent: 'rgba(76,175,80,0.08)' },
    autumn: { sky1: '#1a1412', sky2: '#14100e', accent: 'rgba(191,86,22,0.08)' },
    winter: { sky1: '#1a1c1e', sky2: '#141618', accent: 'rgba(144,164,174,0.05)' },
  };
  const c = palette[season] || palette.autumn;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ width: '400vw' }}>
      {/* Sky */}
      <div className="fixed inset-0" style={{
        background: `linear-gradient(180deg, ${c.sky1} 0%, ${c.sky2} 60%, #0a0a0f 100%)`,
        zIndex: 0,
      }} />

      {/* Subtle atmosphere photo layer */}
      <div className="fixed inset-0" style={{
        zIndex: 1, opacity: 0.12,
        background: 'url(/assets/scene/misty-trees.jpg) center/cover no-repeat',
        filter: 'brightness(0.4) blur(1px)',
      }} />

      {/* Ground */}
      <div className="fixed bottom-0 left-0 right-0" style={{
        height: '35vh', zIndex: 2,
        background: 'linear-gradient(0deg, rgba(6,10,8,0.95) 0%, rgba(8,14,11,0.6) 40%, transparent 100%)',
      }} />

      {/* Season accent wash */}
      <div className="fixed inset-0" style={{ zIndex: 3, background: c.accent, transition: 'background 3s ease' }} />

      {/* God rays — very subtle */}
      <div className="fixed inset-0" style={{
        zIndex: 4,
        background: 'radial-gradient(ellipse 60% 40% at 45% 5%, rgba(255,245,220,0.04) 0%, transparent 60%)',
        animation: 'godRays 15s ease-in-out infinite',
      }} />

      {/* Vignette */}
      <div className="fixed inset-0" style={{
        zIndex: 5,
        background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)',
      }} />

      {/* Film grain */}
      <div className="fixed inset-0" style={{
        zIndex: 6, opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Weather */}
      {weather === 'fog' && <div className="fixed inset-0 bg-white/5 backdrop-blur-[2px] z-10" />}
      {weather === 'light-rain' && <div className="fixed inset-0 bg-black/6 z-10" />}
      {weather === 'heavy-rain' && <div className="fixed inset-0 bg-black/14 z-10" />}

      {/* Bench */}
      <div className="fixed pointer-events-auto" style={{ left: '2.5vw', bottom: '30vh', zIndex: 5 }}>
        <svg width="80" height="50" viewBox="0 0 80 50" className="opacity-20 hover:opacity-35 transition-opacity cursor-pointer">
          <path d="M12,28 L68,28" stroke="rgba(150,130,100,0.4)" strokeWidth="4" strokeLinecap="round" />
          <rect x="18" y="18" width="5" height="14" rx="2" fill="rgba(150,130,100,0.35)" />
          <rect x="57" y="18" width="5" height="14" rx="2" fill="rgba(150,130,100,0.35)" />
        </svg>
        <span className="block text-[9px] text-white/8 text-center mt-1 select-none">歇一歇</span>
      </div>
    </div>
  );
}
