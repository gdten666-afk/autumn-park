'use client';

import { useMemo } from 'react';
import type { SeasonState, Weather } from '@/lib/types';

interface ParkSceneProps {
  seasonState: SeasonState;
  weather: Weather;
  scrollX: number;
}

// --- Tree silhouette generators ---

interface TreeDef {
  x: number;      // vw percentage across full park width
  y: number;      // vh from top
  height: number; // vh
  type: 'round' | 'pointy' | 'bush' | 'pine';
  sway: number;
}

const TREES: TreeDef[] = [
  // Near entrance
  { x: 3, y: 55, height: 22, type: 'round', sway: 0.5 },
  { x: 7, y: 52, height: 25, type: 'round', sway: 0.3 },
  { x: 11, y: 56, height: 18, type: 'bush', sway: 0.7 },
  { x: 15, y: 54, height: 20, type: 'pointy', sway: 0.4 },
  // Mid park
  { x: 25, y: 50, height: 28, type: 'pine', sway: 0.2 },
  { x: 30, y: 55, height: 20, type: 'round', sway: 0.5 },
  { x: 35, y: 53, height: 15, type: 'bush', sway: 0.6 },
  { x: 42, y: 51, height: 24, type: 'pointy', sway: 0.3 },
  { x: 48, y: 56, height: 19, type: 'round', sway: 0.4 },
  // Deep park
  { x: 55, y: 52, height: 26, type: 'pine', sway: 0.2 },
  { x: 60, y: 57, height: 16, type: 'bush', sway: 0.8 },
  { x: 66, y: 50, height: 22, type: 'round', sway: 0.3 },
  { x: 72, y: 54, height: 18, type: 'pointy', sway: 0.5 },
  { x: 78, y: 55, height: 14, type: 'bush', sway: 0.6 },
  // Far end
  { x: 85, y: 51, height: 24, type: 'pine', sway: 0.2 },
  { x: 90, y: 56, height: 20, type: 'round', sway: 0.4 },
  { x: 95, y: 53, height: 17, type: 'bush', sway: 0.7 },
];

function treeColor(seasonState: SeasonState): string {
  switch (seasonState.season) {
    case 'spring': return 'rgba(76, 175, 80, 0.4)';
    case 'summer': return 'rgba(27, 94, 32, 0.45)';
    case 'autumn': return 'rgba(191, 54, 12, 0.35)';
    case 'winter': return 'rgba(69, 90, 100, 0.3)';
  }
}

function groundColor(seasonState: SeasonState): string {
  switch (seasonState.season) {
    case 'spring': return 'linear-gradient(0deg, #2e7d32 0%, #388e3c 30%, #43a047 60%, transparent 100%)';
    case 'summer': return 'linear-gradient(0deg, #1b5e20 0%, #2e7d32 30%, #388e3c 60%, transparent 100%)';
    case 'autumn': return 'linear-gradient(0deg, #3e2723 0%, #4e342e 30%, #5d4037 60%, transparent 100%)';
    case 'winter': return 'linear-gradient(0deg, #90a4ae 0%, #b0bec5 30%, #cfd8dc 60%, transparent 100%)';
  }
}

function skyColor(seasonState: SeasonState): string {
  switch (seasonState.season) {
    case 'spring': return 'linear-gradient(180deg, #bbdefb 0%, #e3f2fd 30%, transparent 100%)';
    case 'summer': return 'linear-gradient(180deg, #64b5f6 0%, #90caf9 30%, transparent 100%)';
    case 'autumn': return 'linear-gradient(180deg, #546e7a 0%, #78909c 30%, transparent 100%)';
    case 'winter': return 'linear-gradient(180deg, #90a4ae 0%, #b0bec5 30%, transparent 100%)';
  }
}

export default function ParkScene({ seasonState, weather, scrollX }: ParkSceneProps) {
  const trees = useMemo(() => TREES, []);
  const treeFill = treeColor(seasonState);
  const groundGrad = groundColor(seasonState);
  const skyGrad = skyColor(seasonState);

  const viewW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewH = typeof window !== 'undefined' ? window.innerHeight : 800;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Sky layer */}
      <div className="fixed inset-0" style={{ background: skyGrad, opacity: 0.4 }} />

      {/* Ground layer */}
      <div className="fixed bottom-0 left-0 right-0 z-0" style={{
        height: '35vh',
        background: groundGrad,
      }} />

      {/* Path — winding trail */}
      <svg className="absolute w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none"
        style={{ width: '400vw', height: '100vh' }}>
        {/* Path background (the trail) */}
        <path
          d="M 0,55 C 5,53 8,57 12,55 C 16,53 20,58 25,56 C 30,54 33,52 38,54 C 43,56 48,53 52,55 C 58,57 62,54 66,52 C 70,50 74,55 78,53 C 82,51 86,55 92,53 C 96,51 100,54 100,52"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Path edge detail */}
        <path
          d="M 0,56 C 5,54 8,58 12,56 C 16,54 20,59 25,57 C 30,55 33,53 38,55 C 43,57 48,54 52,56 C 58,58 62,55 66,53 C 70,51 74,56 78,54 C 82,52 86,56 92,54 C 96,52 100,55 100,53"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      {/* Trees */}
      <svg className="park-tree-layer absolute w-full h-full pointer-events-none"
        viewBox={`0 0 ${400 * 10} ${100 * 10}`}
        preserveAspectRatio="none"
        style={{ width: '400vw', height: '100vh' }}>
        {trees.map((tree, i) => {
          const cx = tree.x * 10;
          const cy = tree.y * 10;
          const h = tree.height * 10;
          const w = h * 0.6;

          switch (tree.type) {
            case 'round':
              return (
                <g key={i} opacity={treeFill.match(/[\d.]+\)$/) ? 0.4 : 0.4}>
                  <rect x={cx - 0.3} y={cy} width={0.6} height={h * 0.6} fill="rgba(139, 90, 43, 0.3)" rx={0.2} />
                  <circle cx={cx} cy={cy - h * 0.05} r={w * 0.55} fill={treeFill} />
                  <circle cx={cx - w * 0.25} cy={cy + h * 0.02} r={w * 0.4} fill={treeFill} />
                  <circle cx={cx + w * 0.25} cy={cy + h * 0.02} r={w * 0.38} fill={treeFill} />
                </g>
              );
            case 'pointy':
              return (
                <g key={i} opacity={0.4}>
                  <rect x={cx - 0.3} y={cy} width={0.6} height={h * 0.5} fill="rgba(139, 90, 43, 0.3)" rx={0.2} />
                  <polygon points={`${cx},${cy - h * 0.15} ${cx - w * 0.5},${cy + h * 0.1} ${cx + w * 0.5},${cy + h * 0.1}`} fill={treeFill} />
                  <polygon points={`${cx},${cy - h * 0.05} ${cx - w * 0.4},${cy + h * 0.2} ${cx + w * 0.4},${cy + h * 0.2}`} fill={treeFill} opacity={0.7} />
                </g>
              );
            case 'bush':
              return (
                <g key={i} opacity={0.5}>
                  <ellipse cx={cx} cy={cy} rx={w * 0.6} ry={h * 0.5} fill={treeFill} />
                  <ellipse cx={cx - w * 0.2} cy={cy + h * 0.05} rx={w * 0.35} ry={h * 0.35} fill={treeFill} opacity={0.7} />
                </g>
              );
            case 'pine':
              return (
                <g key={i} opacity={0.35}>
                  <rect x={cx - 0.3} y={cy} width={0.6} height={h * 0.7} fill="rgba(139, 90, 43, 0.3)" rx={0.2} />
                  <polygon points={`${cx},${cy - h * 0.1} ${cx - w * 0.4},${cy + h * 0.15} ${cx + w * 0.4},${cy + h * 0.15}`} fill={treeFill} />
                  <polygon points={`${cx},${cy - h * 0.02} ${cx - w * 0.35},${cy + h * 0.28} ${cx + w * 0.35},${cy + h * 0.28}`} fill={treeFill} opacity={0.8} />
                  <polygon points={`${cx},${cy + h * 0.08} ${cx - w * 0.28},${cy + h * 0.38} ${cx + w * 0.28},${cy + h * 0.38}`} fill={treeFill} opacity={0.6} />
                </g>
              );
          }
        })}
      </svg>

      {/* Bench at entrance (fixed at start of park) */}
      <div className="fixed pointer-events-auto" style={{ left: '3vw', bottom: '30vh' }}>
        <svg width="60" height="40" viewBox="0 0 60 40" className="opacity-50 hover:opacity-80 transition-opacity cursor-pointer">
          <rect x="5" y="22" width="50" height="4" rx="2" fill="rgba(139,90,43,0.6)" />
          <rect x="10" y="12" width="5" height="12" rx="1" fill="rgba(139,90,43,0.7)" />
          <rect x="45" y="12" width="5" height="12" rx="1" fill="rgba(139,90,43,0.7)" />
          <rect x="8" y="28" width="2" height="6" fill="rgba(139,90,43,0.5)" />
          <rect x="50" y="28" width="2" height="6" fill="rgba(139,90,43,0.5)" />
        </svg>
        <span className="block text-[10px] text-white/20 text-center mt-1">歇一歇</span>
      </div>

      {/* Lamppost */}
      {[20, 50, 80].map(x => (
        <div key={x} className="fixed" style={{ left: `${x}vw`, bottom: '35vh' }}>
          <svg width="8" height="60" viewBox="0 0 8 60" className="opacity-30">
            <rect x="3" y="0" width="2" height="55" fill="rgba(200,200,200,0.5)" rx="1" />
            <circle cx="4" cy="5" r="3" fill="rgba(255,243,224,0.3)" />
            <circle cx="4" cy="5" r="8" fill="rgba(255,243,224,0.05)" />
          </svg>
        </div>
      ))}

      {/* Weather overlay */}
      {weather === 'fog' && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-[1px]" />
      )}
      {weather === 'light-rain' && (
        <div className="fixed inset-0 bg-black/5" />
      )}
      {weather === 'heavy-rain' && (
        <div className="fixed inset-0 bg-black/15" />
      )}
    </div>
  );
}
