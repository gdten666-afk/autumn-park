// lib/particles.ts — 统一的粒子引擎（公园页与角落共用）
import type { Season, Weather } from './types';

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  type: 'leaf' | 'petal' | 'snowflake' | 'raindrop' | 'firefly' | 'fog';
  length?: number;   // 雨滴
  angle?: number;    // 雨滴倾角
  wobble?: number;   // 雪花摆动相位
  wobbleSpeed?: number;
  wind?: number;     // 雪花水平风
}

export const SEASON_PARTICLES: Record<Season, {
  type: Particle['type']; colors: string[]; count: number;
  minSize: number; maxSize: number; minSpeed: number; maxSpeed: number;
}> = {
  spring: { type: 'petal', colors: ['#f3d9c8', '#e8b4a0', '#d98e72', '#fff8f0'], count: 70, minSize: 3, maxSize: 8, minSpeed: 0.3, maxSpeed: 0.8 },
  summer: { type: 'firefly', colors: ['#f2d9a0', '#ecd08a', '#e0bd70'], count: 40, minSize: 2, maxSize: 4, minSpeed: 0.1, maxSpeed: 0.3 },
  autumn: { type: 'leaf', colors: ['#c98a4b', '#b0563c', '#d9a05e'], count: 18, minSize: 4, maxSize: 10, minSpeed: 0.12, maxSpeed: 0.35 },
  winter: { type: 'snowflake', colors: ['rgba(255,255,255,0.9)', 'rgba(240,244,250,0.85)', 'rgba(214,226,240,0.8)'], count: 100, minSize: 2, maxSize: 6, minSpeed: 0.1, maxSpeed: 0.4 },
};

export const WEATHER_PARTICLES: Record<Weather, {
  type: Particle['type']; colors: string[]; density: number;
  speedMult: number; sizeMult: number; replaceSeason: boolean;
} | null> = {
  'sunny': null,
  'cloudy': null,
  'light-rain': { type: 'raindrop', colors: ['rgba(200,215,235,0.7)', 'rgba(180,200,225,0.6)', 'rgba(210,225,240,0.5)'], density: 1.0, speedMult: 2.5, sizeMult: 1.0, replaceSeason: true },
  'heavy-rain': { type: 'raindrop', colors: ['rgba(180,200,225,0.8)', 'rgba(160,185,215,0.7)', 'rgba(190,210,230,0.65)'], density: 2.2, speedMult: 3.5, sizeMult: 1.3, replaceSeason: true },
  'fog': { type: 'fog', colors: ['rgba(210,215,220,0.25)', 'rgba(190,200,210,0.2)'], density: 0.3, speedMult: 0.2, sizeMult: 3.0, replaceSeason: false },
  'snow': { type: 'snowflake', colors: ['rgba(255,255,255,0.8)', 'rgba(235,242,255,0.7)'], density: 1.2, speedMult: 1.0, sizeMult: 1.1, replaceSeason: false },
};

export function createParticle(
  canvasW: number, canvasH: number,
  config: (typeof SEASON_PARTICLES)[keyof typeof SEASON_PARTICLES],
  weatherMult?: { type: Particle['type']; density: number; speedMult: number; sizeMult: number } | null
): Particle {
  const speedMult = weatherMult?.speedMult ?? 1;
  const sizeMult = weatherMult?.sizeMult ?? 1;
  const isFirefly = config.type === 'firefly';
  const isRain = weatherMult?.type === 'raindrop';

  const base: Particle = {
    x: Math.random() * canvasW,
    y: isFirefly ? canvasH * 0.3 + Math.random() * canvasH * 0.4
       : isRain ? -Math.random() * canvasH
       : Math.random() * canvasH,
    vx: (Math.random() - 0.5) * config.maxSpeed * speedMult,
    vy: config.minSpeed * speedMult + Math.random() * (config.maxSpeed - config.minSpeed) * speedMult,
    size: (config.minSize + Math.random() * (config.maxSize - config.minSize)) * sizeMult,
    opacity: isRain ? 0.4 + Math.random() * 0.4 : 0.3 + Math.random() * 0.7,
    rotation: isRain ? 0 : Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    type: weatherMult ? (weatherMult.type === 'raindrop' ? 'raindrop' : weatherMult.type) : config.type,
  };
  if (isRain) {
    base.length = 12 + Math.random() * 24;
    base.angle = 0.25 + Math.random() * 0.1;
  }
  if (base.type === 'snowflake') {
    base.wobble = Math.random() * Math.PI * 2;
    base.wobbleSpeed = 0.01 + Math.random() * 0.02;
    base.wind = (Math.random() - 0.5) * 0.4;
  }
  return base;
}

const RAIN_SPEED = { min: 8, max: 16 };

export function updateParticle(p: Particle, canvasW: number, canvasH: number): Particle {
  if (p.type === 'raindrop') {
    const angle = p.angle || 0.28;
    const speed = RAIN_SPEED.min + Math.random() * (RAIN_SPEED.max - RAIN_SPEED.min);
    p.x += Math.sin(angle) * speed;
    p.y += Math.cos(angle) * speed;
    if (p.y > canvasH + 40) { p.y = -20 - Math.random() * 40; p.x = Math.random() * (canvasW + 100) - 50; }
    if (p.x > canvasW + 50) p.x = -50;
    if (p.x < -50) p.x = canvasW + 50;
    return { ...p };
  }

  let { x, y, opacity, rotation } = p;
  const { vx, vy, rotationSpeed } = p;

  x += vx; y += vy; rotation += rotationSpeed;

  if (p.type === 'firefly') {
    opacity = 0.3 + Math.abs(Math.sin(Date.now() * 0.001 + x * 0.1)) * 0.7;
  }
  if (p.type === 'snowflake' && p.wobble !== undefined) {
    p.wobble += p.wobbleSpeed ?? 0.02;
    x += (p.wind ?? 0) + Math.sin(p.wobble) * 0.3;
  }

  if (y > canvasH + 20) { y = -20; x = Math.random() * canvasW; }
  if (x > canvasW + 20) x = -20;
  if (x < -20) x = canvasW + 20;

  return { ...p, x, y, vx, vy, opacity, rotation, rotationSpeed };
}

export function getMaxParticles(isRain: boolean, weatherDensity: number): number {
  if (isRain) return Math.floor(200 * weatherDensity);
  return 60;
}

// === 绘制（渐变预生成：雨滴渐变按颜色缓存，每帧零创建） ===

export function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  gradientCache: Map<string, CanvasGradient>
): void {
  ctx.save();
  if (p.type === 'raindrop') {
    let grad = gradientCache.get(p.color);
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, -1);
      grad.addColorStop(0, p.color);
      grad.addColorStop(0.3, p.color);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      gradientCache.set(p.color, grad);
    }
    const len = p.length || 20;
    ctx.globalAlpha = p.opacity;
    ctx.translate(p.x, p.y);
    ctx.rotate((p.angle || 0.28) - Math.PI / 2);
    ctx.scale(1, len);
    ctx.strokeStyle = grad;
    ctx.lineWidth = (p.size * 0.6) / len;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 1);
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

// === 引擎：DPR 适配、可见性暂停、rAF 生命周期 ===

export interface ParticleEngine {
  rebuild: (build: (w: number, h: number) => Particle[]) => void;
  start: () => void;
  stop: () => void;
}

export function createParticleEngine(canvas: HTMLCanvasElement): ParticleEngine {
  const ctx = canvas.getContext('2d');
  const gradientCache = new Map<string, CanvasGradient>();
  let particles: Particle[] = [];
  let buildFn: ((w: number, h: number) => Particle[]) | null = null;
  let raf = 0;
  let running = false;
  let w = 0, h = 0;

  const stopLoop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
  const startLoop = () => { if (!raf) raf = requestAnimationFrame(tick); };

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (buildFn) particles = buildFn(w, h);
  }

  function tick() {
    raf = 0;
    if (!running || !ctx) return;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
      particles[i] = updateParticle(particles[i], w, h);
      drawParticle(ctx, particles[i], gradientCache);
    }
    startLoop();
  }

  const onVisibility = () => {
    if (document.hidden) stopLoop(); else if (running) startLoop();
  };

  return {
    rebuild(build) {
      buildFn = build;
      gradientCache.clear();
      resize();
    },
    start() {
      running = true;
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', onVisibility);
      startLoop();
    },
    stop() {
      running = false;
      stopLoop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
