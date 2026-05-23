'use client';

import type { SeasonState, Weather } from '@/lib/types';

interface ParkSceneProps { seasonState: SeasonState; weather: Weather; }

export default function ParkScene({ seasonState, weather }: ParkSceneProps) {
  const season = seasonState.season;

  const palette: Record<string, { sky1: string; sky2: string; ground: string; accent: string; rays: string }> = {
    spring: { sky1: '#1a1a28', sky2: '#141820', ground: 'rgba(20,25,18,0.9)', accent: 'rgba(140,180,160,0.04)', rays: 'rgba(200,220,210,0.03)' },
    summer: { sky1: '#14141e', sky2: '#0e1018', ground: 'rgba(15,20,16,0.9)', accent: 'rgba(120,160,140,0.05)', rays: 'rgba(220,200,160,0.04)' },
    autumn: { sky1: '#18141a', sky2: '#120e14', ground: 'rgba(20,16,14,0.9)', accent: 'rgba(180,120,60,0.06)', rays: 'rgba(220,180,140,0.03)' },
    winter: { sky1: '#16181c', sky2: '#101214', ground: 'rgba(16,18,20,0.9)', accent: 'rgba(140,150,170,0.04)', rays: 'rgba(180,190,210,0.02)' },
  };
  const c = palette[season] || palette.autumn;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ width: '400vw' }}>
      {/* Sky — deep indigo/navy, NOT green */}
      <div className="fixed inset-0" style={{ background: `linear-gradient(180deg, ${c.sky1} 0%, ${c.sky2} 55%, #080810 100%)`, zIndex: 0 }} />

      {/* Subtle atmosphere texture */}
      <div className="fixed inset-0" style={{ zIndex: 1, opacity: 0.08, background: 'url(/assets/scene/misty-trees.jpg) center/cover no-repeat', filter: 'brightness(0.3) blur(1.5px)' }} />

      {/* Ground */}
      <div className="fixed bottom-0 left-0 right-0" style={{ height: '32vh', zIndex: 2, background: `linear-gradient(0deg, ${c.ground} 0%, rgba(8,10,14,0.4) 50%, transparent 100%)` }} />

      {/* Season accent wash */}
      <div className="fixed inset-0" style={{ zIndex: 3, background: c.accent, transition: 'background 4s ease' }} />

      {/* God rays */}
      <div className="fixed inset-0" style={{ zIndex: 4, background: `radial-gradient(ellipse 50% 35% at 40% 8%, ${c.rays} 0%, transparent 55%)`, animation: 'godRays 18s ease-in-out infinite' }} />

      {/* Vignette */}
      <div className="fixed inset-0" style={{ zIndex: 5, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />

      {/* Film grain */}
      <div className="fixed inset-0" style={{ zIndex: 6, opacity: 0.02, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Weather */}
      {weather === 'fog' && <div className="fixed inset-0 bg-white/4 backdrop-blur-[2px] z-10" />}
      {weather === 'light-rain' && <div className="fixed inset-0 bg-black/5 z-10" />}
      {weather === 'heavy-rain' && <div className="fixed inset-0 bg-black/12 z-10" />}

      {/* Bench */}
      <div className="fixed pointer-events-auto" style={{ left: '2.5vw', bottom: '28vh', zIndex: 5 }}>
        <svg width="80" height="50" viewBox="0 0 80 50" className="opacity-15 hover:opacity-25 transition-opacity cursor-pointer">
          <path d="M12,28 L68,28" stroke="rgba(180,160,130,0.35)" strokeWidth="4" strokeLinecap="round" />
          <rect x="18" y="18" width="5" height="14" rx="2" fill="rgba(180,160,130,0.3)" />
          <rect x="57" y="18" width="5" height="14" rx="2" fill="rgba(180,160,130,0.3)" />
        </svg>
      </div>
    </div>
  );
}
