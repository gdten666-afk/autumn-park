'use client';

import { useMemo } from 'react';
import type { SeasonState, Weather } from '@/lib/types';

interface ParkSceneProps {
  seasonState: SeasonState;
  weather: Weather;
  scrollX: number;
}

interface TreeDef {
  x: number; y: number; height: number;
  type: 'round' | 'pointy' | 'bush' | 'pine' | 'tall';
}

function generateTrees(): TreeDef[] {
  const trees: TreeDef[] = [];
  const types: TreeDef['type'][] = ['round', 'pointy', 'bush', 'pine', 'tall', 'round', 'bush', 'pointy'];
  for (let x = 1; x < 100; x += 3 + Math.random() * 5) {
    trees.push({
      x,
      y: 50 + Math.random() * 12,
      height: 12 + Math.random() * 22,
      type: types[Math.floor(Math.random() * types.length)],
    });
  }
  return trees;
}

function treeColor(season: string): string {
  switch (season) {
    case 'spring': return 'rgba(76, 175, 80, 0.35)';
    case 'summer': return 'rgba(27, 94, 32, 0.4)';
    case 'autumn': return 'rgba(191, 54, 12, 0.3)';
    case 'winter': return 'rgba(69, 90, 100, 0.25)';
    default: return 'rgba(76, 175, 80, 0.35)';
  }
}

function groundGradient(season: string): string {
  switch (season) {
    case 'spring': return 'linear-gradient(0deg, #1b5e20 0%, #2e7d32 25%, #388e3c 50%, transparent 100%)';
    case 'summer': return 'linear-gradient(0deg, #0d3b0d 0%, #1b5e20 25%, #2e7d32 50%, transparent 100%)';
    case 'autumn': return 'linear-gradient(0deg, #2c1810 0%, #3e2723 25%, #4e342e 50%, transparent 100%)';
    case 'winter': return 'linear-gradient(0deg, #78909c 0%, #90a4ae 25%, #b0bec5 50%, transparent 100%)';
    default: return 'linear-gradient(0deg, #1b5e20 0%, #2e7d32 25%, #388e3c 50%, transparent 100%)';
  }
}

function skyGradient(season: string): string {
  switch (season) {
    case 'spring': return 'linear-gradient(180deg, #90caf9 0%, #bbdefb 15%, #e3f2fd 35%, transparent 100%)';
    case 'summer': return 'linear-gradient(180deg, #42a5f5 0%, #64b5f6 15%, #90caf9 35%, transparent 100%)';
    case 'autumn': return 'linear-gradient(180deg, #455a64 0%, #546e7a 15%, #78909c 35%, transparent 100%)';
    case 'winter': return 'linear-gradient(180deg, #78909c 0%, #90a4ae 15%, #b0bec5 35%, transparent 100%)';
    default: return 'linear-gradient(180deg, #90caf9 0%, #bbdefb 15%, #e3f2fd 35%, transparent 100%)';
  }
}

function mistColor(season: string): string {
  switch (season) {
    case 'spring': return 'rgba(200, 230, 200, 0.06)';
    case 'summer': return 'rgba(180, 210, 180, 0.04)';
    case 'autumn': return 'rgba(200, 150, 100, 0.06)';
    case 'winter': return 'rgba(200, 210, 220, 0.08)';
    default: return 'rgba(200, 230, 200, 0.06)';
  }
}

export default function ParkScene({ seasonState, weather, scrollX }: ParkSceneProps) {
  const trees = useMemo(() => generateTrees(), []);
  const tColor = treeColor(seasonState.season);
  const ground = groundGradient(seasonState.season);
  const sky = skyGradient(seasonState.season);
  const mist = mistColor(seasonState.season);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Sky */}
      <div className="fixed inset-0" style={{ background: sky, opacity: 0.35 }} />

      {/* Distant tree layer (smaller, lighter) */}
      <svg className="fixed inset-0" viewBox="0 0 4000 1000" preserveAspectRatio="none"
        style={{ width: '400vw', height: '100vh', opacity: 0.3 }}>
        {trees.filter((_, i) => i % 3 === 0).map((tree, i) => {
          const cx = tree.x * 10;
          const cy = tree.y * 10;
          const h = tree.height * 8 * 0.6;
          const w = h * 0.5;
          return <ellipse key={`d${i}`} cx={cx} cy={cy} rx={w * 0.6} ry={h * 0.5} fill={tColor} />;
        })}
      </svg>

      {/* Ground */}
      <div className="fixed bottom-0 left-0 right-0 z-0" style={{ height: '40vh', background: ground }} />

      {/* Ground mist */}
      <div className="fixed bottom-0 left-0 right-0 z-0" style={{
        height: '15vh',
        background: `linear-gradient(0deg, ${mist}, transparent 100%)`,
      }} />

      {/* Path */}
      <svg className="absolute w-full h-full" viewBox="0 0 400 100"
        style={{ width: '400vw', height: '100vh' }}>
        <path d="M 0,56 C 5,54 10,58 16,56 C 22,54 28,60 35,57 C 42,54 48,52 55,55 C 62,58 68,55 74,53 C 80,51 86,56 93,54 C 97,53 100,55 100,55"
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" strokeLinecap="round" />
        <path d="M 0,57 C 5,55 10,59 16,57 C 22,55 28,61 35,58 C 42,55 48,53 55,56 C 62,59 68,56 74,54 C 80,52 86,57 93,55 C 97,54 100,56 100,56"
          fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" strokeLinecap="round" />
      </svg>

      {/* Trees (foreground) */}
      <svg className="fixed inset-0" viewBox="0 0 4000 1000" preserveAspectRatio="none"
        style={{ width: '400vw', height: '100vh' }}>
        {trees.map((tree, i) => {
          const cx = tree.x * 10;
          const cy = tree.y * 10;
          const h = tree.height * 8;
          const w = h * 0.55;
          const trunk = 'rgba(100,70,40,0.25)';

          switch (tree.type) {
            case 'round':
              return (
                <g key={i}>
                  <rect x={cx - 0.4} y={cy - h * 0.05} width={0.8} height={h * 0.55} fill={trunk} rx={0.3} />
                  <circle cx={cx} cy={cy - h * 0.08} r={w * 0.5} fill={tColor} />
                  <circle cx={cx - w * 0.22} cy={cy - h * 0.02} r={w * 0.38} fill={tColor} opacity={0.8} />
                  <circle cx={cx + w * 0.2} cy={cy - h * 0.03} r={w * 0.35} fill={tColor} opacity={0.7} />
                </g>
              );
            case 'pointy':
              return (
                <g key={i}>
                  <rect x={cx - 0.4} y={cy - h * 0.08} width={0.8} height={h * 0.45} fill={trunk} rx={0.3} />
                  <polygon points={`${cx},${cy - h * 0.2} ${cx - w * 0.45},${cy + h * 0.05} ${cx + w * 0.45},${cy + h * 0.05}`} fill={tColor} />
                  <polygon points={`${cx},${cy - h * 0.08} ${cx - w * 0.35},${cy + h * 0.15} ${cx + w * 0.35},${cy + h * 0.15}`} fill={tColor} opacity={0.7} />
                </g>
              );
            case 'bush':
              return (
                <g key={i}>
                  <ellipse cx={cx} cy={cy} rx={w * 0.55} ry={h * 0.45} fill={tColor} />
                  <ellipse cx={cx - w * 0.15} cy={cy + h * 0.03} rx={w * 0.3} ry={h * 0.3} fill={tColor} opacity={0.7} />
                  <ellipse cx={cx + w * 0.2} cy={cy + h * 0.02} rx={w * 0.28} ry={h * 0.28} fill={tColor} opacity={0.6} />
                </g>
              );
            case 'pine':
              return (
                <g key={i}>
                  <rect x={cx - 0.35} y={cy - h * 0.1} width={0.7} height={h * 0.65} fill={trunk} rx={0.2} />
                  <polygon points={`${cx},${cy - h * 0.15} ${cx - w * 0.35},${cy + h * 0.1} ${cx + w * 0.35},${cy + h * 0.1}`} fill={tColor} />
                  <polygon points={`${cx},${cy - h * 0.05} ${cx - w * 0.3},${cy + h * 0.22} ${cx + w * 0.3},${cy + h * 0.22}`} fill={tColor} opacity={0.8} />
                  <polygon points={`${cx},${cy + h * 0.06} ${cx - w * 0.22},${cy + h * 0.32} ${cx + w * 0.22},${cy + h * 0.32}`} fill={tColor} opacity={0.6} />
                </g>
              );
            case 'tall':
              return (
                <g key={i}>
                  <rect x={cx - 0.5} y={cy - h * 0.05} width={1} height={h * 0.7} fill={trunk} rx={0.4} />
                  <ellipse cx={cx} cy={cy - h * 0.1} rx={w * 0.42} ry={h * 0.28} fill={tColor} />
                  <ellipse cx={cx - w * 0.18} cy={cy - h * 0.04} rx={w * 0.3} ry={h * 0.2} fill={tColor} opacity={0.7} />
                </g>
              );
          }
        })}
      </svg>

      {/* Bench */}
      <div className="fixed pointer-events-auto" style={{ left: '2.5vw', bottom: '32vh' }}>
        <svg width="70" height="44" viewBox="0 0 70 44" className="opacity-40 hover:opacity-60 transition-opacity cursor-pointer">
          <rect x="8" y="24" width="54" height="5" rx="2.5" fill="rgba(120,80,40,0.6)" />
          <rect x="14" y="14" width="5" height="13" rx="1.5" fill="rgba(120,80,40,0.7)" />
          <rect x="51" y="14" width="5" height="13" rx="1.5" fill="rgba(120,80,40,0.7)" />
          <rect x="10" y="32" width="2.5" height="8" rx="1" fill="rgba(120,80,40,0.4)" />
          <rect x="57" y="32" width="2.5" height="8" rx="1" fill="rgba(120,80,40,0.4)" />
        </svg>
        <span className="block text-[9px] text-white/15 text-center mt-1">歇一歇</span>
      </div>

      {/* Lampposts with glow */}
      {[18, 45, 75].map(x => (
        <div key={x} className="fixed" style={{ left: `${x}vw`, bottom: '36vh' }}>
          <svg width="12" height="70" viewBox="0 0 12 70" className="opacity-35">
            <rect x="5" y="2" width="2" height="60" fill="rgba(180,180,190,0.5)" rx="1" />
            <circle cx="6" cy="6" r="4" fill="rgba(255,243,224,0.25)" />
            <circle cx="6" cy="6" r="12" fill="rgba(255,243,224,0.04)" />
          </svg>
        </div>
      ))}

      {/* Weather atmospheric overlay */}
      {weather === 'fog' && <div className="fixed inset-0 bg-white/6 backdrop-blur-[2px]" />}
      {weather === 'light-rain' && <div className="fixed inset-0 bg-black/5" />}
      {weather === 'heavy-rain' && <div className="fixed inset-0 bg-black/15" />}
    </div>
  );
}
