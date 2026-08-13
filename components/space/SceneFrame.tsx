// components/space/SceneFrame.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { Scene, Weather } from '@/lib/types';

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

// --- Weather particle system for the corner ---

interface RainParticle {
  x: number; y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  color: string;
}

interface SnowParticle {
  x: number; y: number;
  radius: number;
  speed: number;
  wind: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

function createRainDrop(w: number, _h: number, heavy: boolean): RainParticle {
  return {
    x: Math.random() * (w + 100) - 50,
    y: -Math.random() * 200,
    length: heavy ? 15 + Math.random() * 25 : 10 + Math.random() * 18,
    speed: heavy ? 10 + Math.random() * 10 : 7 + Math.random() * 7,
    angle: 0.22 + Math.random() * 0.12,
    opacity: heavy ? 0.4 + Math.random() * 0.35 : 0.3 + Math.random() * 0.3,
    color: `rgba(${70 + Math.floor(Math.random()*40)}, ${90 + Math.floor(Math.random()*40)}, ${120 + Math.floor(Math.random()*40)}`,
  };
}

function createSnowflake(w: number, h: number): SnowParticle {
  return {
    x: Math.random() * w,
    y: -Math.random() * h,
    radius: 1.5 + Math.random() * 3,
    speed: 0.4 + Math.random() * 0.8,
    wind: (Math.random() - 0.5) * 0.4,
    opacity: 0.5 + Math.random() * 0.5,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.01 + Math.random() * 0.02,
  };
}

function updateRainDrops(drops: RainParticle[], w: number, h: number): void {
  for (const d of drops) {
    d.x += Math.sin(d.angle) * d.speed;
    d.y += Math.cos(d.angle) * d.speed;
    if (d.y > h + 40) {
      d.y = -20 - Math.random() * 40;
      d.x = Math.random() * (w + 100) - 50;
    }
  }
}

function updateSnowflakes(flakes: SnowParticle[], w: number, h: number): void {
  for (const f of flakes) {
    f.wobble += f.wobbleSpeed;
    f.x += f.wind + Math.sin(f.wobble) * 0.3;
    f.y += f.speed;
    if (f.y > h + 10) { f.y = -10; f.x = Math.random() * w; }
    if (f.x > w + 10) f.x = -10;
    if (f.x < -10) f.x = w + 10;
  }
}

function drawRain(ctx: CanvasRenderingContext2D, drops: RainParticle[]): void {
  for (const d of drops) {
    const dx = Math.sin(d.angle) * d.length;
    const dy = Math.cos(d.angle) * d.length;
    const grad = ctx.createLinearGradient(d.x, d.y, d.x - dx, d.y - dy);
    grad.addColorStop(0, `${d.color}, ${d.opacity + 0.15})`);
    grad.addColorStop(0.4, `${d.color}, ${d.opacity})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - dx, d.y - dy);
    ctx.stroke();
  }
}

function drawSnow(ctx: CanvasRenderingContext2D, flakes: SnowParticle[]): void {
  for (const f of flakes) {
    ctx.fillStyle = `rgba(150,170,190,${f.opacity})`;
    ctx.shadowBlur = f.radius * 3;
    ctx.shadowColor = `rgba(150,170,190,${f.opacity * 0.5})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function WeatherParticles({ weather }: { weather: Weather }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const isRain = weather === 'light-rain' || weather === 'heavy-rain';
    const isSnow = weather === 'snow';
    if (!isRain && !isSnow) return;

    const heavy = weather === 'heavy-rain';

    let drops: RainParticle[] = [];
    let flakes: SnowParticle[] = [];

    if (isRain) {
      const count = heavy ? 200 : 100;
      drops = Array.from({ length: count }, () => createRainDrop(canvas.width, canvas.height, heavy));
    }
    if (isSnow) {
      flakes = Array.from({ length: 100 }, () => createSnowflake(canvas.width, canvas.height));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (drops.length) { updateRainDrops(drops, canvas.width, canvas.height); drawRain(ctx, drops); }
      if (flakes.length) { updateSnowflakes(flakes, canvas.width, canvas.height); drawSnow(ctx, flakes); }
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
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
