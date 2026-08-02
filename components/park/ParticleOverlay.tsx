'use client';

import { useEffect, useRef } from 'react';
import { SEASON_PARTICLES, WEATHER_PARTICLES, createParticle, updateParticle, getMaxParticles } from '@/lib/particles';
import type { SeasonState, Weather } from '@/lib/types';
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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

    const weatherConfig = WEATHER_PARTICLES[weather];
    const isRain = weatherConfig?.type === 'raindrop';
    const replaceSeason = weatherConfig?.replaceSeason ?? false;

    const config = SEASON_PARTICLES[seasonState.season];
    const maxParticles = getMaxParticles(isRain, weatherConfig?.density ?? 1);

    // Generate particles
    if (isRain) {
      // Rain: use only rain particles, no season particles
      const count = Math.floor(120 * (weatherConfig!.density));
      particlesRef.current = Array.from({ length: Math.min(count, maxParticles) }, () =>
        createParticle(canvas.width, canvas.height, config, {
          type: 'raindrop',
          density: weatherConfig!.density,
          speedMult: weatherConfig!.speedMult,
          sizeMult: weatherConfig!.sizeMult,
        })
      );
    } else if (replaceSeason && weatherConfig) {
      const count = Math.floor(config.count * weatherConfig.density);
      particlesRef.current = Array.from({ length: Math.min(count, maxParticles) }, () =>
        createParticle(canvas.width, canvas.height, config, weatherConfig)
      );
    } else {
      // Normal season particles + optional weather enhancement
      const count = Math.floor(config.count * (weatherConfig?.density ?? 1));
      particlesRef.current = Array.from({ length: Math.min(count, maxParticles) }, () =>
        createParticle(canvas.width, canvas.height, config, weatherConfig)
      );

      // Season transition particles
      if (seasonState.secondarySeason && seasonState.transitionWeight > 0) {
        const secConfig = SEASON_PARTICLES[seasonState.secondarySeason];
        const secCount = Math.floor(secConfig.count * seasonState.transitionWeight);
        const secParticles = Array.from({ length: Math.min(secCount, 50) }, () =>
          createParticle(canvas.width, canvas.height, secConfig, null)
        );
        particlesRef.current = [...particlesRef.current, ...secParticles].slice(0, maxParticles);
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesRef.current.length; i++) {
        particlesRef.current[i] = updateParticle(particlesRef.current[i], canvas.width, canvas.height);
        drawParticle(ctx, particlesRef.current[i]);
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

  if (p.type === 'raindrop') {
    // Rain: angled streak with gradient fade
    const angle = p.angle || 0.28;
    const len = p.length || 20;
    const dx = Math.sin(angle) * len;
    const dy = Math.cos(angle) * len;

    const grad = ctx.createLinearGradient(p.x, p.y, p.x - dx, p.y - dy);
    grad.addColorStop(0, p.color.replace(/[\d.]+\)$/, `${p.opacity + 0.2})`));
    grad.addColorStop(0.3, p.color);
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = p.size * 0.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - dx, p.y - dy);
    ctx.stroke();
    ctx.restore();
    return;
  }

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
      ctx.shadowBlur = p.size * 2;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
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
