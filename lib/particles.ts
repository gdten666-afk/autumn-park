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
  // Rain-specific
  length?: number;
  angle?: number;
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
  autumn:   { type: 'leaf',     colors: ['#c98a4b', '#b56a4c', '#d9a05e'], count: 18, minSize: 4, maxSize: 10, minSpeed: 0.12, maxSpeed: 0.35 },
  winter:   { type: 'snowflake',colors: ['#fff', '#e3f2fd', '#bbdefb'],               count: 120, minSize: 2, maxSize: 6,  minSpeed: 0.1, maxSpeed: 0.4 },
};

export const WEATHER_PARTICLES: Record<Weather, {
  type: Particle['type'];
  colors: string[];
  density: number;
  speedMult: number;
  sizeMult: number;
  replaceSeason: boolean;
} | null> = {
  'sunny':       null,
  'cloudy':      null,
  'light-rain':  { type: 'raindrop', colors: ['rgba(200,215,235,0.7)', 'rgba(180,200,225,0.6)', 'rgba(210,225,240,0.5)'], density: 1.0, speedMult: 2.5, sizeMult: 1.0, replaceSeason: true },
  'heavy-rain':  { type: 'raindrop', colors: ['rgba(180,200,225,0.8)', 'rgba(160,185,215,0.7)', 'rgba(190,210,230,0.65)'], density: 2.2, speedMult: 3.5, sizeMult: 1.3, replaceSeason: true },
  'fog':         { type: 'fog',      colors: ['rgba(210,215,220,0.25)', 'rgba(190,200,210,0.2)'], density: 0.3, speedMult: 0.2, sizeMult: 3.0, replaceSeason: false },
  'snow':        { type: 'snowflake',colors: ['rgba(255,255,255,0.8)', 'rgba(235,242,255,0.7)'], density: 1.2, speedMult: 1.0, sizeMult: 1.1, replaceSeason: false },
};

export function createParticle(
  canvasW: number,
  canvasH: number,
  config: typeof SEASON_PARTICLES[keyof typeof SEASON_PARTICLES],
  weatherMult?: { type: Particle['type']; density: number; speedMult: number; sizeMult: number } | null
): Particle {
  const speedMult = weatherMult?.speedMult ?? 1;
  const sizeMult = weatherMult?.sizeMult ?? 1;

  const isFirefly = config.type === 'firefly';
  const isRain = weatherMult?.type === 'raindrop';

  const base: Particle = {
    x: Math.random() * canvasW,
    y: isFirefly ? canvasH * 0.3 + Math.random() * canvasH * 0.4
       : isRain ? -Math.random() * canvasH  // rain starts above viewport
       : Math.random() * canvasH,
    vx: (Math.random() - 0.5) * config.maxSpeed * speedMult,
    vy: config.minSpeed * speedMult + Math.random() * (config.maxSpeed - config.minSpeed) * speedMult,
    size: (config.minSize + Math.random() * (config.maxSize - config.minSize)) * sizeMult,
    opacity: isRain ? 0.4 + Math.random() * 0.4 : 0.3 + Math.random() * 0.7,
    rotation: isRain ? 0 : Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    type: weatherMult ? weatherMult.type === 'raindrop' ? 'raindrop' : weatherMult.type : config.type,
  };

  if (isRain) {
    base.length = 12 + Math.random() * 24;  // rain streak length: 12-36px
    base.angle = 0.25 + Math.random() * 0.1;  // ~14-20 degrees from vertical
  }

  return base;
}

const RAIN_SPEED = { min: 8, max: 16 };  // pixels per frame for rain

export function updateParticle(p: Particle, canvasW: number, canvasH: number): Particle {
  const isRain = p.type === 'raindrop';

  if (isRain) {
    const angle = p.angle || 0.28;
    const speed = RAIN_SPEED.min + Math.random() * (RAIN_SPEED.max - RAIN_SPEED.min);
    p.x += Math.sin(angle) * speed;
    p.y += Math.cos(angle) * speed;

    // Wrap: when rain exits bottom, reset to top
    if (p.y > canvasH + 40) {
      p.y = -20 - Math.random() * 40;
      p.x = Math.random() * (canvasW + 100) - 50;
    }
    if (p.x > canvasW + 50) p.x = -50;
    if (p.x < -50) p.x = canvasW + 50;

    return { ...p };
  }

  let { x, y, opacity, rotation } = p;
  const { vx, vy, rotationSpeed } = p;

  x += vx;
  y += vy;
  rotation += rotationSpeed;

  if (p.type === 'firefly') {
    opacity = 0.3 + Math.abs(Math.sin(Date.now() * 0.001 + x * 0.1)) * 0.7;
  }

  if (y > canvasH + 20) { y = -20; x = Math.random() * canvasW; }
  if (x > canvasW + 20) x = -20;
  if (x < -20) x = canvasW + 20;

  return { ...p, x, y, vx, vy, opacity, rotation, rotationSpeed };
}

// Raindrop count: heavy rain can produce many more particles
export function getMaxParticles(isRain: boolean, weatherDensity: number): number {
  if (isRain) return Math.floor(200 * weatherDensity);  // up to ~440 for heavy rain
  return 60;
}
