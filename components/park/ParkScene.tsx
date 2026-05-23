'use client';

import { useMemo } from 'react';
import type { SeasonState, Weather } from '@/lib/types';

interface ParkSceneProps {
  seasonState: SeasonState;
  weather: Weather;
  scrollX: number;
}

// --- Hand-crafted organic tree silhouettes using bezier curves ---

function OakTree({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  // s = scale factor (height in viewport units * some factor)
  const t = s; // trunk height
  const w = t * 0.15; // trunk width
  const fh = t * 0.9; // foliage height
  const fw = t * 0.7; // foliage width
  return (
    <g>
      {/* Trunk - slight curve */}
      <path d={`M ${cx - w * 0.5} ${cy} Q ${cx - w * 0.3} ${cy - t * 0.6} ${cx} ${cy - t} L ${cx + w * 0.4} ${cy - t * 0.95} Q ${cx + w * 0.3} ${cy - t * 0.5} ${cx + w * 0.45} ${cy}`}
        fill="rgba(90,65,40,0.35)" />
      {/* Main foliage mass */}
      <path d={`M ${cx - fw * 0.5} ${cy - t * 0.3}
        C ${cx - fw * 0.7} ${cy - t * 0.6}, ${cx - fw * 0.55} ${cy - t * 0.95}, ${cx - fw * 0.15} ${cy - t * 1.05}
        C ${cx - fw * 0.1} ${cy - t * 1.2}, ${cx + fw * 0.05} ${cy - t * 1.25}, ${cx + fw * 0.2} ${cy - t * 1.05}
        C ${cx + fw * 0.4} ${cy - t * 1.1}, ${cx + fw * 0.55} ${cy - t * 0.85}, ${cx + fw * 0.45} ${cy - t * 0.6}
        C ${cx + fw * 0.65} ${cy - t * 0.55}, ${cx + fw * 0.5} ${cy - t * 0.25}, ${cx + fw * 0.2} ${cy - t * 0.2}
        C ${cx + fw * 0.1} ${cy - t * 0.05}, ${cx - fw * 0.1} ${cy - t * 0.15}, ${cx - fw * 0.5} ${cy - t * 0.3} Z`}
        fill="rgba(76,175,80,0.28)" />
      {/* Secondary foliage clusters */}
      <path d={`M ${cx + fw * 0.15} ${cy - t * 0.7}
        C ${cx + fw * 0.1} ${cy - t * 0.85}, ${cx + fw * 0.3} ${cy - t * 0.95}, ${cx + fw * 0.35} ${cy - t * 0.75}
        C ${cx + fw * 0.45} ${cy - t * 0.7}, ${cx + fw * 0.3} ${cy - t * 0.55}, ${cx + fw * 0.15} ${cy - t * 0.7} Z`}
        fill="rgba(76,175,80,0.2)" />
      <path d={`M ${cx - fw * 0.3} ${cy - t * 0.5}
        C ${cx - fw * 0.45} ${cy - t * 0.65}, ${cx - fw * 0.4} ${cy - t * 0.8}, ${cx - fw * 0.2} ${cy - t * 0.7}
        C ${cx - fw * 0.1} ${cy - t * 0.75}, ${cx - fw * 0.15} ${cy - t * 0.55}, ${cx - fw * 0.3} ${cy - t * 0.5} Z`}
        fill="rgba(76,175,80,0.22)" />
    </g>
  );
}

function PineTree({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const t = s * 0.25;
  const h = s;
  const w = h * 0.35;
  return (
    <g>
      <path d={`M ${cx - t * 0.3} ${cy} Q ${cx} ${cy - t * 0.3} ${cx} ${cy - t} L ${cx + t * 0.25} ${cy - t * 0.95} Q ${cx + t * 0.1} ${cy - t * 0.3} ${cx + t * 0.3} ${cy}`}
        fill="rgba(90,65,40,0.3)" />
      <path d={`M ${cx} ${cy - h * 0.85}
        L ${cx - w * 0.6} ${cy - h * 0.4} L ${cx - w * 0.25} ${cy - h * 0.35}
        L ${cx - w * 0.75} ${cy - h * 0.05} L ${cx - w * 0.2} ${cy + h * 0.02}
        L ${cx - w * 0.55} ${cy + h * 0.2} L ${cx} ${cy + h * 0.08}
        L ${cx + w * 0.55} ${cy + h * 0.2} L ${cx + w * 0.2} ${cy + h * 0.02}
        L ${cx + w * 0.75} ${cy - h * 0.05} L ${cx + w * 0.25} ${cy - h * 0.35}
        L ${cx + w * 0.6} ${cy - h * 0.4} Z`}
        fill="rgba(46,125,50,0.25)" />
    </g>
  );
}

function WillowTree({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const t = s * 0.4;
  const w = s * 0.12;
  const ch = s * 0.6; // canopy height
  const cw = s * 0.55; // canopy width
  return (
    <g>
      <path d={`M ${cx - w * 0.5} ${cy} Q ${cx} ${cy - t * 0.4} ${cx} ${cy - t} L ${cx + w * 0.4} ${cy - t * 0.95} Q ${cx + w * 0.2} ${cy - t * 0.3} ${cx + w * 0.45} ${cy}`}
        fill="rgba(90,65,40,0.3)" />
      {/* Drooping canopy */}
      <path d={`M ${cx - cw * 0.5} ${cy - t * 0.6}
        C ${cx - cw * 0.7} ${cy - t * 0.5}, ${cx - cw * 0.6} ${cy - t * 1.05}, ${cx} ${cy - t * 1.1}
        C ${cx + cw * 0.6} ${cy - t * 1.05}, ${cx + cw * 0.7} ${cy - t * 0.5}, ${cx + cw * 0.5} ${cy - t * 0.6}
        C ${cx + cw * 0.55} ${cy - t * 0.2}, ${cx + cw * 0.3} ${cy - t * 0.1}, ${cx} ${cy - t * 0.05}
        C ${cx - cw * 0.3} ${cy - t * 0.1}, ${cx - cw * 0.55} ${cy - t * 0.2}, ${cx - cw * 0.5} ${cy - t * 0.6} Z`}
        fill="rgba(104,159,56,0.25)" />
      {/* Hanging branches */}
      {[[-0.3, 0.3], [0.1, 0.35], [-0.1, 0.25], [0.25, 0.28]].map(([dx, len], i) => (
        <path key={i} d={`M ${cx + dx * cw} ${cy - t * 0.75}
          Q ${cx + dx * cw * 1.3} ${cy - t * 0.5} ${cx + dx * cw * 1.1} ${cy - t * 0.3}`}
          stroke="rgba(104,159,56,0.2)" strokeWidth={w * 0.3} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
}

function BushCluster({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const w = s * 0.6;
  const h = s * 0.5;
  return (
    <path d={`M ${cx - w * 0.5} ${cy}
      C ${cx - w * 0.6} ${cy - h * 0.4}, ${cx - w * 0.55} ${cy - h * 0.75}, ${cx - w * 0.2} ${cy - h * 0.8}
      C ${cx - w * 0.15} ${cy - h * 1.05}, ${cx + w * 0.1} ${cy - h * 1.1}, ${cx + w * 0.25} ${cy - h * 0.75}
      C ${cx + w * 0.3} ${cy - h * 0.8}, ${cx + w * 0.5} ${cy - h * 0.5}, ${cx + w * 0.45} ${cy - h * 0.2}
      C ${cx + w * 0.5} ${cy - h * 0.05}, ${cx + w * 0.3} ${cy + h * 0.05}, ${cx + w * 0.1} ${cy}
      C ${cx + w * 0.2} ${cy - h * 0.1}, ${cx - w * 0.05} ${cy + h * 0.05}, ${cx - w * 0.5} ${cy} Z`}
      fill="rgba(76,175,80,0.25)" />
  );
}

function BirchTree({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const t = s;
  const w = t * 0.08;
  const fh = t * 0.7;
  const fw = t * 0.35;
  return (
    <g>
      <path d={`M ${cx - w * 0.5} ${cy} Q ${cx - w * 0.2} ${cy - t * 0.5} ${cx} ${cy - t} L ${cx + w * 0.3} ${cy - t * 0.95} Q ${cx + w * 0.1} ${cy - t * 0.4} ${cx + w * 0.4} ${cy}`}
        fill="rgba(200,190,180,0.3)" />
      <path d={`M ${cx - fw * 0.5} ${cy - t * 0.35}
        C ${cx - fw * 0.5} ${cy - t * 0.6}, ${cx - fw * 0.3} ${cy - t * 0.9}, ${cx} ${cy - t * 0.95}
        C ${cx + fw * 0.3} ${cy - t * 0.9}, ${cx + fw * 0.5} ${cy - t * 0.6}, ${cx + fw * 0.5} ${cy - t * 0.35}
        C ${cx + fw * 0.3} ${cy - t * 0.25}, ${cx - fw * 0.3} ${cy - t * 0.25}, ${cx - fw * 0.5} ${cy - t * 0.35} Z`}
        fill="rgba(129,199,132,0.22)" />
    </g>
  );
}

// --- Scene ---

interface TreeDef { x: number; y: number; s: number; type: 'oak' | 'pine' | 'willow' | 'bush' | 'birch'; }

function generateTrees(): TreeDef[] {
  const trees: TreeDef[] = [];
  const types: TreeDef['type'][] = ['oak', 'pine', 'willow', 'bush', 'birch', 'oak', 'bush', 'pine', 'willow', 'birch', 'oak', 'bush'];
  for (let x = 1; x < 100; x += 2.5 + Math.random() * 5) {
    trees.push({
      x, y: 52 + Math.random() * 10,
      s: 14 + Math.random() * 18,
      type: types[Math.floor(Math.random() * types.length)],
    });
  }
  return trees;
}

function foliageColor(season: string, opacity: number): string {
  switch (season) {
    case 'spring': return `rgba(102,187,106,${opacity})`;
    case 'summer': return `rgba(46,125,50,${opacity})`;
    case 'autumn': return `rgba(191,86,22,${opacity})`;
    case 'winter': return `rgba(120,144,156,${opacity})`;
    default: return `rgba(102,187,106,${opacity})`;
  }
}

function groundGradient(season: string): string {
  switch (season) {
    case 'spring': return 'linear-gradient(0deg, rgba(30,70,25,0.9) 0%, rgba(40,100,40,0.5) 30%, rgba(60,140,55,0.15) 60%, transparent 100%)';
    case 'summer': return 'linear-gradient(0deg, rgba(15,50,15,0.9) 0%, rgba(25,80,30,0.5) 30%, rgba(40,110,40,0.15) 60%, transparent 100%)';
    case 'autumn': return 'linear-gradient(0deg, rgba(50,20,10,0.9) 0%, rgba(70,35,20,0.5) 30%, rgba(90,50,30,0.15) 60%, transparent 100%)';
    case 'winter': return 'linear-gradient(0deg, rgba(60,70,80,0.85) 0%, rgba(100,110,120,0.45) 30%, rgba(150,160,170,0.12) 60%, transparent 100%)';
    default: return 'linear-gradient(0deg, rgba(30,70,25,0.9) 0%, rgba(40,100,40,0.5) 30%, rgba(60,140,55,0.15) 60%, transparent 100%)';
  }
}

function skyGradient(season: string): string {
  switch (season) {
    case 'spring': return 'linear-gradient(180deg, rgba(130,190,240,0.45) 0%, rgba(180,210,240,0.25) 20%, rgba(220,235,248,0.08) 45%, transparent 100%)';
    case 'summer': return 'linear-gradient(180deg, rgba(60,140,220,0.5) 0%, rgba(100,160,230,0.28) 20%, rgba(150,190,240,0.1) 45%, transparent 100%)';
    case 'autumn': return 'linear-gradient(180deg, rgba(80,75,85,0.5) 0%, rgba(110,100,110,0.3) 20%, rgba(150,135,140,0.1) 45%, transparent 100%)';
    case 'winter': return 'linear-gradient(180deg, rgba(120,130,145,0.5) 0%, rgba(150,160,175,0.28) 20%, rgba(190,195,205,0.08) 45%, transparent 100%)';
    default: return 'linear-gradient(180deg, rgba(130,190,240,0.45) 0%, rgba(180,210,240,0.25) 20%, rgba(220,235,248,0.08) 45%, transparent 100%)';
  }
}

export default function ParkScene({ seasonState, weather }: ParkSceneProps) {
  const trees = useMemo(() => generateTrees(), []);
  const season = seasonState.season;
  const fgColor = foliageColor(season, 0.3);
  const fgColorLight = foliageColor(season, 0.18);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Sky */}
      <div className="fixed inset-0 z-0" style={{ background: skyGradient(season) }} />

      {/* Distant trees — smaller, monochrome, low opacity */}
      <svg className="fixed inset-0 z-0" viewBox="0 0 4000 1000" preserveAspectRatio="none"
        style={{ width: '400vw', height: '100vh', opacity: 0.5 }}>
        {trees.filter((_, i) => i % 2 === 0).map((tree, i) => {
          const cx = tree.x * 10;
          const cy = tree.y * 10;
          const ss = tree.s * 5;
          return <ellipse key={`bg${i}`} cx={cx} cy={cy - ss * 0.15} rx={ss * 0.22} ry={ss * 0.18} fill={fgColor} />;
        })}
      </svg>

      {/* Ground */}
      <div className="fixed bottom-0 left-0 right-0 z-0" style={{ height: '42vh', background: groundGradient(season) }} />

      {/* Ground mist layer */}
      <div className="fixed bottom-0 left-0 right-0 z-0" style={{
        height: '12vh',
        background: `linear-gradient(0deg, rgba(255,255,255,0.04) 0%, transparent 100%)`,
      }} />

      {/* Path — winding trail */}
      <svg className="absolute w-full h-full z-0" viewBox="0 0 400 100"
        style={{ width: '400vw', height: '100vh' }}>
        <defs>
          <filter id="pathBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" />
          </filter>
        </defs>
        <path d="M -2,57 C 8,55 15,59 22,56 C 30,53 38,60 46,57 C 54,54 60,52 68,55 C 76,58 84,54 92,53 C 97,52 102,55 102,55"
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" strokeLinecap="round" filter="url(#pathBlur)" />
      </svg>

      {/* Trees — foreground, detailed silhouettes */}
      <svg className="fixed inset-0 z-0" viewBox="0 0 4000 1000" preserveAspectRatio="none"
        style={{ width: '400vw', height: '100vh' }}>
        {trees.map((tree, i) => {
          const cx = tree.x * 10;
          const cy = tree.y * 10;
          const ss = tree.s * 6.5;
          const TreeComponent = {
            oak: OakTree, pine: PineTree, willow: WillowTree, bush: BushCluster, birch: BirchTree,
          }[tree.type];
          return <TreeComponent key={i} cx={cx} cy={cy} s={ss} />;
        })}
      </svg>

      {/* Bench */}
      <div className="fixed z-0" style={{ left: '2.5vw', bottom: '32vh' }}>
        <svg width="80" height="50" viewBox="0 0 80 50" className="opacity-35 hover:opacity-55 transition-opacity cursor-pointer pointer-events-auto">
          <path d="M 12,28 L 68,28" stroke="rgba(130,90,50,0.6)" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 12,29 L 68,29" stroke="rgba(130,90,50,0.3)" strokeWidth="2" strokeLinecap="round" />
          <rect x="18" y="18" width="5" height="14" rx="2" fill="rgba(130,90,50,0.5)" />
          <rect x="57" y="18" width="5" height="14" rx="2" fill="rgba(130,90,50,0.5)" />
          <rect x="10" y="35" width="3" height="10" rx="1.5" fill="rgba(130,90,50,0.3)" />
          <rect x="67" y="35" width="3" height="10" rx="1.5" fill="rgba(130,90,50,0.3)" />
        </svg>
        <span className="block text-[9px] text-white/12 text-center mt-1 select-none">歇一歇</span>
      </div>

      {/* Lampposts */}
      {[18, 45, 75].map(x => (
        <div key={x} className="fixed z-0" style={{ left: `${x}vw`, bottom: '36vh' }}>
          <svg width="14" height="80" viewBox="0 0 14 80" className="opacity-30">
            <path d="M 7,5 L 7,65" stroke="rgba(170,170,185,0.5)" strokeWidth="2" strokeLinecap="round" />
            <path d="M 3,8 Q 7,2 11,8" stroke="rgba(170,170,185,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <circle cx="7" cy="6" r="10" fill="rgba(255,243,224,0.06)" />
            <circle cx="7" cy="6" r="4" fill="rgba(255,243,224,0.15)" />
          </svg>
        </div>
      ))}

      {/* Noise texture overlay for film-grain richness */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        mixBlendMode: 'overlay' as any,
      }} />

      {/* Vignette */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
      }} />

      {/* Weather */}
      {weather === 'fog' && <div className="fixed inset-0 z-0 bg-white/5 backdrop-blur-[2px]" />}
      {weather === 'light-rain' && <div className="fixed inset-0 z-0 bg-black/5" />}
      {weather === 'heavy-rain' && <div className="fixed inset-0 z-0 bg-black/15" />}
    </div>
  );
}
