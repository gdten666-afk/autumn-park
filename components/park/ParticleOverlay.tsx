'use client';

import { useEffect, useRef } from 'react';
import { SEASON_PARTICLES, WEATHER_PARTICLES, createParticle, updateParticle } from '@/lib/particles';
import type { Season, Weather, SeasonState } from '@/lib/types';
import type { Particle } from '@/lib/particles';

interface ParticleOverlayProps {
  seasonState: SeasonState;
  weather: Weather;
}

export default function ParticleOverlay({ seasonState, weather }: ParticleOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const config = SEASON_PARTICLES[seasonState.season];
    const weatherConfig = WEATHER_PARTICLES[weather];
    const count = Math.floor(config.count * (weatherConfig?.density ?? 1));
    particlesRef.current = Array.from({ length: Math.min(count, 60) }, () =>
      createParticle(canvas.width, canvas.height, config, weatherConfig)
    );

    if (seasonState.secondarySeason && seasonState.transitionWeight > 0) {
      const secConfig = SEASON_PARTICLES[seasonState.secondarySeason];
      const secCount = Math.floor(secConfig.count * seasonState.transitionWeight);
      const secParticles = Array.from({ length: Math.min(secCount, 50) }, () =>
        createParticle(canvas.width, canvas.height, secConfig, null)
      );
      particlesRef.current = [...particlesRef.current, ...secParticles].slice(0, 60);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        updateParticle(p, canvas.width, canvas.height);
        drawParticle(ctx, p);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [seasonState.season, seasonState.secondarySeason, seasonState.transitionWeight, weather]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" />;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  switch (p.type) {
    case 'leaf':
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'petal':
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'snowflake':
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'raindrop':
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, p.size * 3);
      ctx.stroke();
      break;
    case 'firefly':
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.size * 3;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'fog':
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 5, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

  ctx.restore();
}
