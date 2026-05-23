// lib/particles.ts
import type { Season, Weather } from './types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  type: 'leaf' | 'petal' | 'snowflake' | 'raindrop' | 'firefly' | 'fog';
}

export const SEASON_PARTICLES: Record<Season, {
  type: Particle['type'];
  colors: string[];
  count: number;
  minSize: number;
  maxSize: number;
  minSpeed: number;
  maxSpeed: number;
}> = {
  spring:   { type: 'petal',    colors: ['#fce4ec', '#f8bbd0', '#f48fb1', '#fff'], count: 80,  minSize: 3, maxSize: 8,  minSpeed: 0.3, maxSpeed: 0.8 },
  summer:   { type: 'firefly',  colors: ['#fff9c4', '#ffecb3', '#ffe082'],          count: 40,  minSize: 2, maxSize: 4,  minSpeed: 0.1, maxSpeed: 0.3 },
  autumn:   { type: 'leaf',     colors: ['#ff8f00', '#d84315', '#bf360c', '#f9a825'], count: 100, minSize: 4, maxSize: 12, minSpeed: 0.4, maxSpeed: 1.0 },
  winter:   { type: 'snowflake',colors: ['#fff', '#e3f2fd', '#bbdefb'],               count: 120, minSize: 2, maxSize: 6,  minSpeed: 0.1, maxSpeed: 0.4 },
};

export const WEATHER_PARTICLES: Record<Weather, {
  type: Particle['type'];
  colors: string[];
  density: number;   // multiplier on base count
  speedMult: number;
  sizeMult: number;
} | null> = {
  'sunny':       null,
  'cloudy':      null,
  'light-rain':  { type: 'raindrop', colors: ['#90caf9', '#64b5f6'], density: 0.5, speedMult: 2.0, sizeMult: 0.5 },
  'heavy-rain':  { type: 'raindrop', colors: ['#64b5f6', '#42a5f5'], density: 1.5, speedMult: 3.0, sizeMult: 0.7 },
  'fog':         { type: 'fog',      colors: ['#cfd8dc', '#b0bec5'], density: 0.3, speedMult: 0.2, sizeMult: 3.0 },
  'snow':        { type: 'snowflake',colors: ['#fff', '#e3f2fd'],     density: 1.0, speedMult: 1.0, sizeMult: 1.0 },
};

export function createParticle(
  canvasW: number,
  canvasH: number,
  config: typeof SEASON_PARTICLES[keyof typeof SEASON_PARTICLES],
  weatherMult?: { type: Particle['type']; density: number; speedMult: number; sizeMult: number } | null
): Particle {
  const densityMult = weatherMult?.density ?? 1;
  const speedMult = weatherMult?.speedMult ?? 1;
  const sizeMult = weatherMult?.sizeMult ?? 1;

  const isFirefly = config.type === 'firefly';

  return {
    x: Math.random() * canvasW,
    y: isFirefly ? canvasH * 0.3 + Math.random() * canvasH * 0.4 : Math.random() * canvasH,
    vx: (Math.random() - 0.5) * config.maxSpeed * speedMult,
    vy: config.minSpeed * speedMult + Math.random() * (config.maxSpeed - config.minSpeed) * speedMult,
    size: (config.minSize + Math.random() * (config.maxSize - config.minSize)) * sizeMult,
    opacity: 0.3 + Math.random() * 0.7,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    type: weatherMult ? weatherMult.type === 'raindrop' ? 'raindrop' : weatherMult.type : config.type,
  };
}

export function updateParticle(p: Particle, canvasW: number, canvasH: number): Particle {
  let { x, y, vx, vy, opacity, rotation, rotationSpeed } = p;

  x += vx;
  y += vy;
  rotation += rotationSpeed;

  // Fireflies flicker
  if (p.type === 'firefly') {
    opacity = 0.3 + Math.abs(Math.sin(Date.now() * 0.001 + x * 0.1)) * 0.7;
  }

  // Wrap around
  if (y > canvasH + 20) { y = -20; x = Math.random() * canvasW; }
  if (x > canvasW + 20) x = -20;
  if (x < -20) x = canvasW + 20;

  return { ...p, x, y, vx, vy, opacity, rotation, rotationSpeed };
}
