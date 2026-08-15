'use client';

import { useEffect, useRef } from 'react';
import type { SeasonState, Weather } from '@/lib/types';
import { getTimeOfDay } from '@/lib/time';

interface ParkSceneProps { seasonState: SeasonState; weather: Weather; }

function NightSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    // Static stars
    const stars: {x:number;y:number;r:number;o:number}[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * 2000, y: Math.random() * 1200,
        r: 0.3 + Math.random() * 1.2,
        o: 0.3 + Math.random() * 0.7,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const s of stars) {
        ctx.fillStyle = `rgba(255,255,255,${s.o * (0.7 + 0.3 * Math.sin(Date.now()*0.0005 + s.x))})`;
        ctx.beginPath(); ctx.arc(s.x % c.width, s.y % c.height, s.r, 0, Math.PI*2); ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    const id = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0" style={{ zIndex: 4 }} />;
}

const PALETTE: Record<string, { sky: string; ground: string; accent: string; rays: string }> = {
  spring: { sky: 'linear-gradient(180deg,#f2efe7 0%,#f7f5ef 55%,#ece8dc 100%)', ground: 'linear-gradient(0deg, rgba(120,140,110,0.14) 0%, rgba(160,170,140,0.06) 45%, transparent 100%)', accent: 'rgba(140,170,130,0.05)', rays: 'rgba(255,250,240,0.25)' },
  summer: { sky: 'linear-gradient(180deg,#eef0ea 0%,#f6f4ec 55%,#ebe5d6 100%)', ground: 'linear-gradient(0deg, rgba(130,150,110,0.14) 0%, rgba(170,175,140,0.06) 45%, transparent 100%)', accent: 'rgba(120,160,120,0.05)', rays: 'rgba(255,246,225,0.3)' },
  autumn: { sky: 'linear-gradient(180deg,#f3efe6 0%,#f7f4ec 55%,#eee7da 100%)', ground: 'linear-gradient(0deg, rgba(150,110,70,0.14) 0%, rgba(180,150,110,0.06) 45%, transparent 100%)', accent: 'rgba(181,106,76,0.05)', rays: 'rgba(255,238,210,0.28)' },
  winter: { sky: 'linear-gradient(180deg,#eef1f2 0%,#f5f5f1 55%,#e8e9e4 100%)', ground: 'linear-gradient(0deg, rgba(150,155,165,0.12) 0%, rgba(180,185,190,0.05) 45%, transparent 100%)', accent: 'rgba(150,160,180,0.04)', rays: 'rgba(245,245,250,0.2)' },
};

export default function ParkScene({ seasonState, weather }: ParkSceneProps) {
  const season = seasonState.season;
  const tod = getTimeOfDay();

  const c = PALETTE[season] || PALETTE.spring;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Sky */}
      <div className="absolute inset-0" style={{ background: c.sky, zIndex: 0 }} />

      {/* Sunny: bright warm glow + sun */}
      {weather === 'sunny' && (
        <>
          <div className="parallax-slow absolute" style={{
            top: '5%', left: '55%',
            width: 'clamp(120px, 20vw, 240px)', height: 'clamp(120px, 20vw, 240px)',
            zIndex: 2,
          }}>
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(circle, rgba(249,232,200,0.9) 0%, rgba(242,213,160,0.4) 35%, rgba(242,213,160,0) 68%)',
              borderRadius: '50%',
              animation: 'sunPulse 9s ease-in-out infinite',
            }} />
          </div>
          <div className="absolute inset-0" style={{
            zIndex: 3,
            background: 'linear-gradient(180deg, rgba(255,248,235,0.28) 0%, rgba(255,252,246,0.12) 40%, transparent 70%)',
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
          <div className="parallax-slow absolute inset-0" style={{ zIndex: 4 }}>
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse 70% 30% at 40% 10%, rgba(220,220,230,0.3) 0%, transparent 60%)',
              animation: 'cloudDrift 20s ease-in-out infinite',
            }} />
          </div>
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
            background: 'linear-gradient(180deg, rgba(214,219,224,0.62) 0%, rgba(222,227,232,0.55) 50%, rgba(232,237,242,0.5) 100%)',
          }} />
          <div className="absolute inset-0" style={{
            zIndex: 4,
            background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(240,242,245,0.5) 0%, transparent 70%)',
            animation: 'fogDrift 16s ease-in-out infinite',
          }} />
        </>
      )}

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '30vh', zIndex: 2, background: c.ground }} />

      {/* 简约线稿插画：地平线 + 树 */}
      <div className="parallax-slow absolute inset-0" style={{ zIndex: 2, pointerEvents: 'none' }}>
        <svg viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 'auto 0 0 0', width: '100%', height: '42%', opacity: 0.9 }}>
          <line x1="0" y1="330" x2="1440" y2="330" stroke="rgba(60,52,40,0.14)" strokeWidth="1.2" />
          <g stroke="rgba(60,52,40,0.5)" strokeWidth="2.4" strokeLinecap="round" fill="none">
            <path d="M260 332 C256 296 250 268 262 234" />
            <path d="M264 262 C238 244 222 246 206 228 M264 246 C244 228 238 220 226 200" />
            <path d="M1170 334 C1174 300 1180 274 1168 244" />
            <path d="M1168 270 C1192 254 1206 256 1220 240 M1168 254 C1186 238 1192 230 1202 212" />
          </g>
          <circle cx="206" cy="228" r="7" fill="rgba(201,138,75,0.5)" />
          <circle cx="226" cy="200" r="6" fill="rgba(217,160,94,0.5)" />
          <circle cx="1220" cy="240" r="6" fill="rgba(201,138,75,0.5)" />
          <circle cx="1202" cy="212" r="5" fill="rgba(217,160,94,0.5)" />
          <path d="M180 340 C320 322 480 322 620 340" stroke="rgba(60,52,40,0.22)" strokeWidth="1.2" />
          <path d="M860 344 C1020 328 1180 328 1300 344" stroke="rgba(60,52,40,0.2)" strokeWidth="1.2" />
        </svg>
      </div>

      {/* Season accent */}
      <div className="absolute inset-0" style={{ zIndex: 3, background: c.accent, transition: 'background 4s ease' }} />

      {/* === Time-of-day overlays === */}

      {/* Night (20:00-5:00): dark blue + stars */}
      {tod === 'night' && (
        <>
          <div className="absolute inset-0" style={{
            zIndex: 4,
            background: 'linear-gradient(180deg, rgba(10,15,35,0.65) 0%, rgba(15,20,45,0.55) 40%, rgba(20,30,50,0.45) 100%)',
          }} />
          <NightSky />
          {/* Moon */}
          <div className="absolute" style={{
            top: '6%', right: '18%',
            width: 'clamp(40px,6vw,80px)', height: 'clamp(40px,6vw,80px)',
            background: 'radial-gradient(circle at 35% 35%, rgba(255,250,235,0.9) 0%, rgba(240,235,210,0.6) 30%, rgba(200,200,210,0.1) 60%, transparent 70%)',
            borderRadius: '50%', zIndex: 4,
            boxShadow: '0 0 40px rgba(200,200,220,0.3), 0 0 80px rgba(200,200,220,0.15)',
          }} />
        </>
      )}

      {/* Evening (17:00-20:00): warm golden hour */}
      {tod === 'evening' && (
        <div className="absolute inset-0" style={{
          zIndex: 4,
          background: 'linear-gradient(180deg, rgba(255,180,100,0.25) 0%, rgba(255,150,80,0.15) 30%, rgba(200,120,60,0.1) 60%, rgba(100,60,40,0.15) 100%)',
        }} />
      )}

      {/* Morning (5:00-10:00): soft pink dawn */}
      {tod === 'morning' && (
        <div className="absolute inset-0" style={{
          zIndex: 4,
          background: 'linear-gradient(180deg, rgba(255,200,180,0.15) 0%, rgba(255,220,200,0.1) 30%, rgba(255,240,230,0.05) 60%, transparent 100%)',
        }} />
      )}

      {/* Subtle vignette */}
      <div className="absolute inset-0" style={{ zIndex: 5, background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.06) 100%)' }} />
    </div>
  );
}
