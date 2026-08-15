'use client';

import { useEffect, useRef } from 'react';
import {
  SEASON_PARTICLES, WEATHER_PARTICLES, createParticle,
  getMaxParticles, createParticleEngine,
} from '@/lib/particles';
import type { SeasonState, Weather } from '@/lib/types';
import type { Particle } from '@/lib/particles';

interface ParticleOverlayProps { seasonState: SeasonState; weather: Weather; }

export default function ParticleOverlay({ seasonState, weather }: ParticleOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createParticleEngine(canvas);
    const weatherConfig = WEATHER_PARTICLES[weather];
    const isRain = weatherConfig?.type === 'raindrop';
    const replaceSeason = weatherConfig?.replaceSeason ?? false;
    const config = SEASON_PARTICLES[seasonState.season];
    const maxParticles = getMaxParticles(isRain, weatherConfig?.density ?? 1);

    const build = (w: number, h: number): Particle[] => {
      if (isRain) {
        const count = Math.floor(120 * (weatherConfig!.density));
        return Array.from({ length: Math.min(count, maxParticles) }, () =>
          createParticle(w, h, config, {
            type: 'raindrop', density: weatherConfig!.density,
            speedMult: weatherConfig!.speedMult, sizeMult: weatherConfig!.sizeMult,
          }));
      }
      if (replaceSeason && weatherConfig) {
        const count = Math.floor(config.count * weatherConfig.density);
        return Array.from({ length: Math.min(count, maxParticles) }, () =>
          createParticle(w, h, config, weatherConfig));
      }
      const base = Array.from({ length: Math.floor(config.count * (weatherConfig?.density ?? 1)) }, () =>
        createParticle(w, h, config, weatherConfig));
      if (seasonState.secondarySeason && seasonState.transitionWeight > 0) {
        const secConfig = SEASON_PARTICLES[seasonState.secondarySeason];
        const secCount = Math.floor(secConfig.count * seasonState.transitionWeight);
        base.push(...Array.from({ length: Math.min(secCount, 50) }, () =>
          createParticle(w, h, secConfig, null)));
      }
      return base.slice(0, maxParticles);
    };

    engine.rebuild(build);
    engine.start();
    return () => engine.stop();
  }, [seasonState.season, seasonState.secondarySeason, seasonState.transitionWeight, weather]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" />;
}
