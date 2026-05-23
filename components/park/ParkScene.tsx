'use client';

import { useMemo } from 'react';
import type { SeasonState, Weather } from '@/lib/types';

interface ParkSceneProps {
  seasonState: SeasonState;
  weather: Weather;
  scrollX: number;
}

// ============================================================
// Organic tree silhouettes — all bezier curves, no primitives
// ============================================================

function OakSilhouette({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const t = s; const w = t * 0.12; const fw = t * 0.65;
  return (
    <g>
      <path d={`M${cx-w*.4} ${cy} Q${cx-w*.2} ${cy-t*.55} ${cx} ${cy-t} L${cx+w*.3} ${cy-t*.92} Q${cx+w*.2} ${cy-t*.45} ${cx+w*.4} ${cy}`}
        fill="rgba(85,60,38,0.4)" />
      <path d={`M${cx-fw*.5} ${cy-t*.28}
        C${cx-fw*.65} ${cy-t*.58} ${cx-fw*.5} ${cy-t*.92} ${cx-fw*.12} ${cy-t*1.02}
        C${cx-fw*.08} ${cy-t*1.18} ${cx+fw*.04} ${cy-t*1.22} ${cx+fw*.18} ${cy-t*1.02}
        C${cx+fw*.38} ${cy-t*1.08} ${cx+fw*.52} ${cy-t*.82} ${cx+fw*.42} ${cy-t*.58}
        C${cx+fw*.6} ${cy-t*.52} ${cx+fw*.45} ${cy-t*.22} ${cx+fw*.18} ${cy-t*.18}
        C${cx+fw*.08} ${cy-t*.04} ${cx-fw*.08} ${cy-t*.12} ${cx-fw*.5} ${cy-t*.28}Z`}
        fill="currentColor" />
    </g>
  );
}

function PineSilhouette({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const t = s * 0.22; const h = s; const w = h * 0.32;
  return (
    <g>
      <path d={`M${cx-t*.25} ${cy} Q${cx} ${cy-t*.28} ${cx} ${cy-t} L${cx+t*.2} ${cy-t*.93} Q${cx+t*.08} ${cy-t*.28} ${cx+t*.25} ${cy}`}
        fill="rgba(85,60,38,0.35)" />
      <path d={`M${cx} ${cy-h*.82}
        L${cx-w*.55} ${cy-h*.38} L${cx-w*.22} ${cy-h*.33}
        L${cx-w*.7} ${cy-h*.03} L${cx-w*.18} ${cy+h*.02}
        L${cx-w*.5} ${cy+h*.18} L${cx} ${cy+h*.07}
        L${cx+w*.5} ${cy+h*.18} L${cx+w*.18} ${cy+h*.02}
        L${cx+w*.7} ${cy-h*.03} L${cx+w*.22} ${cy-h*.33}
        L${cx+w*.55} ${cy-h*.38}Z`}
        fill="var(--tree-fill)" opacity="0.85" />
    </g>
  );
}

function WillowSilhouette({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const t = s * 0.35; const w = s * 0.1; const cw = s * 0.5;
  return (
    <g>
      <path d={`M${cx-w*.4} ${cy} Q${cx} ${cy-t*.38} ${cx} ${cy-t} L${cx+w*.3} ${cy-t*.93} Q${cx+w*.15} ${cy-t*.28} ${cx+w*.4} ${cy}`}
        fill="rgba(85,60,38,0.35)" />
      <path d={`M${cx-cw*.45} ${cy-t*.58}
        C${cx-cw*.65} ${cy-t*.48} ${cx-cw*.55} ${cy-t*1.02} ${cx} ${cy-t*1.08}
        C${cx+cw*.55} ${cy-t*1.02} ${cx+cw*.65} ${cy-t*.48} ${cx+cw*.45} ${cy-t*.58}
        C${cx+cw*.5} ${cy-t*.18} ${cx+cw*.25} ${cy-t*.08} ${cx} ${cy-t*.03}
        C${cx-cw*.25} ${cy-t*.08} ${cx-cw*.5} ${cy-t*.18} ${cx-cw*.45} ${cy-t*.58}Z`}
        fill="var(--tree-fill)" opacity="0.8" />
      {[[-0.28,0.3],[0.08,0.35],[-0.08,0.22],[0.22,0.3]].map(([dx,len],i) => (
        <path key={i} d={`M${cx+dx*cw} ${cy-t*.72} Q${cx+dx*cw*1.25} ${cy-t*.48} ${cx+dx*cw*1.05} ${cy-t*.28}`}
          stroke="var(--tree-fill)" strokeWidth={w*0.25} fill="none" strokeLinecap="round" opacity="0.7" />
      ))}
    </g>
  );
}

function BushSilhouette({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const w = s * 0.55; const h = s * 0.45;
  return (
    <path d={`M${cx-w*.45} ${cy}
      C${cx-w*.55} ${cy-h*.38} ${cx-w*.5} ${cy-h*.72} ${cx-w*.18} ${cy-h*.78}
      C${cx-w*.12} ${cy-h*1.02} ${cx+w*.08} ${cy-h*1.08} ${cx+w*.22} ${cy-h*.72}
      C${cx+w*.28} ${cy-h*.78} ${cx+w*.48} ${cy-h*.48} ${cx+w*.42} ${cy-h*.18}
      C${cx+w*.48} ${cy-h*.03} ${cx+w*.28} ${cy+h*.05} ${cx+w*.08} ${cy}
      C${cx+w*.18} ${cy-h*.08} ${cx-w*.05} ${cy+h*.05} ${cx-w*.45} ${cy}Z`}
      fill="var(--tree-fill)" opacity="0.75" />
  );
}

function BirchSilhouette({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const t = s; const w = t * 0.06; const fw = t * 0.32;
  return (
    <g>
      <path d={`M${cx-w*.4} ${cy} Q${cx-w*.15} ${cy-t*.48} ${cx} ${cy-t} L${cx+w*.25} ${cy-t*.92} Q${cx+w*.08} ${cy-t*.38} ${cx+w*.35} ${cy}`}
        fill="rgba(190,180,170,0.35)" />
      <path d={`M${cx-fw*.45} ${cy-t*.32}
        C${cx-fw*.45} ${cy-t*.58} ${cx-fw*.25} ${cy-t*.88} ${cx} ${cy-t*.92}
        C${cx+fw*.25} ${cy-t*.88} ${cx+fw*.45} ${cy-t*.58} ${cx+fw*.45} ${cy-t*.32}
        C${cx+fw*.25} ${cy-t*.22} ${cx-fw*.25} ${cy-t*.22} ${cx-fw*.45} ${cy-t*.32}Z`}
        fill="var(--tree-fill)" opacity="0.7" />
    </g>
  );
}

function DeadTree({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const t = s; const w = t * 0.06;
  return (
    <g>
      <path d={`M${cx-w*.4} ${cy} Q${cx} ${cy-t*.35} ${cx-w*.1} ${cy-t*.55} Q${cx} ${cy-t*.65} ${cx+w*.15} ${cy-t*.6}`}
        stroke="rgba(100,85,75,0.3)" strokeWidth={w} fill="none" strokeLinecap="round" />
      <path d={`M${cx-w*.08} ${cy-t*.5} Q${cx-w*.3} ${cy-t*.65} ${cx-w*.4} ${cy-t*.7}`}
        stroke="rgba(100,85,75,0.25)" strokeWidth={w*.7} fill="none" strokeLinecap="round" />
      <path d={`M${cx+w*.08} ${cy-t*.55} Q${cx+w*.25} ${cy-t*.7} ${cx+w*.35} ${cy-t*.75}`}
        stroke="rgba(100,85,75,0.22)" strokeWidth={w*.6} fill="none" strokeLinecap="round" />
    </g>
  );
}

// ============================================================
// Depth layer definitions
// ============================================================

interface TreeDef { x: number; y: number; s: number; type: 'oak'|'pine'|'willow'|'bush'|'birch'|'dead'; }

function makeTrees(count: number, yRange: [number,number], sRange: [number,number], types: TreeDef['type'][]): TreeDef[] {
  return Array.from({length: count}, () => ({
    x: Math.random() * 100,
    y: yRange[0] + Math.random() * (yRange[1] - yRange[0]),
    s: sRange[0] + Math.random() * (sRange[1] - sRange[0]),
    type: types[Math.floor(Math.random() * types.length)],
  }));
}

// ============================================================
// Scene colors per season
// ============================================================

function seasonColors(season: string) {
  switch (season) {
    case 'spring': return { tree: 'rgba(102,187,106,0.35)', sky: 'linear-gradient(180deg, rgba(130,190,240,0.48) 0%, rgba(180,210,240,0.28) 20%, rgba(220,235,248,0.1) 50%, transparent 100%)', ground: 'linear-gradient(0deg, rgba(30,70,25,0.92) 0%, rgba(45,105,38,0.55) 35%, rgba(65,145,55,0.15) 70%, transparent 100%)', mist: 'rgba(200,230,200,0.06)', light: 'rgba(255,250,235,0.08)' };
    case 'summer': return { tree: 'rgba(46,125,50,0.38)', sky: 'linear-gradient(180deg, rgba(60,140,220,0.52) 0%, rgba(100,160,230,0.3) 20%, rgba(150,190,240,0.12) 50%, transparent 100%)', ground: 'linear-gradient(0deg, rgba(15,50,15,0.92) 0%, rgba(28,82,28,0.55) 35%, rgba(42,115,40,0.15) 70%, transparent 100%)', mist: 'rgba(180,210,180,0.04)', light: 'rgba(255,245,220,0.1)' };
    case 'autumn': return { tree: 'rgba(191,86,22,0.32)', sky: 'linear-gradient(180deg, rgba(80,75,85,0.52) 0%, rgba(110,100,110,0.32) 20%, rgba(150,135,140,0.12) 50%, transparent 100%)', ground: 'linear-gradient(0deg, rgba(50,20,10,0.92) 0%, rgba(72,38,20,0.55) 35%, rgba(95,55,30,0.15) 70%, transparent 100%)', mist: 'rgba(200,150,100,0.06)', light: 'rgba(255,220,170,0.06)' };
    case 'winter': return { tree: 'rgba(120,144,156,0.28)', sky: 'linear-gradient(180deg, rgba(120,130,145,0.52) 0%, rgba(150,160,175,0.3) 20%, rgba(190,195,205,0.1) 50%, transparent 100%)', ground: 'linear-gradient(0deg, rgba(60,70,80,0.88) 0%, rgba(100,110,120,0.5) 35%, rgba(150,160,170,0.12) 70%, transparent 100%)', mist: 'rgba(200,210,220,0.08)', light: 'rgba(220,225,240,0.04)' };
    default: return { tree: 'rgba(102,187,106,0.35)', sky: 'linear-gradient(180deg, rgba(130,190,240,0.48) 0%, rgba(180,210,240,0.28) 20%, rgba(220,235,248,0.1) 50%, transparent 100%)', ground: 'linear-gradient(0deg, rgba(30,70,25,0.92) 0%, rgba(45,105,38,0.55) 35%, rgba(65,145,55,0.15) 70%, transparent 100%)', mist: 'rgba(200,230,200,0.06)', light: 'rgba(255,250,235,0.08)' };
  }
}

// ============================================================
// Main Scene Component
// ============================================================

export default function ParkScene({ seasonState, weather, scrollX }: ParkSceneProps) {
  const season = seasonState.season;
  const colors = seasonColors(season);

  // Tree layers at different depths
  const farTrees = useMemo(() => makeTrees(12, [52,60], [14,22], ['pine','birch','oak']), []);
  const midTrees = useMemo(() => makeTrees(18, [50,62], [16,28], ['oak','pine','willow','birch','dead']), []);
  const nearTrees = useMemo(() => makeTrees(14, [54,65], [20,35], ['oak','willow','bush']), []);

  // Parallax factors: lower = slower = farther away
  const FAR = 0.06;
  const MID = 0.2;
  const NEAR = 0.55;
  const FRONT = 1.1;

  const treeRenderer = (type: string, cx: number, cy: number, s: number, i: number) => {
    const C = { oak: OakSilhouette, pine: PineSilhouette, willow: WillowSilhouette, bush: BushSilhouette, birch: BirchSilhouette, dead: DeadTree }[type];
    return C ? <C key={i} cx={cx} cy={cy} s={s} /> : null;
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ width: '400vw' }}>
      <style>{`.park-layer { position: fixed; top: 0; height: 100vh; will-change: transform; }`}</style>

      {/* ── Layer 1: Sky (fixed, no parallax) ── */}
      <div className="park-layer" style={{ left: 0, right: 0, background: colors.sky, zIndex: 0 }} />

      {/* ── Layer 2: Far mountains & distant trees ── */}
      <div className="park-layer" style={{
        transform: `translateX(${-scrollX * FAR}px)`,
        width: '440vw', left: '-20vw',
        background: 'transparent', zIndex: 1,
      }}>
        <svg viewBox="0 0 4400 1000" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          {/* Distant hills */}
          <path d="M0,620 Q200,520 500,580 Q800,540 1200,590 Q1600,530 2000,570 Q2400,510 2800,580 Q3200,530 3600,560 Q4000,520 4400,590 L4400,1000 L0,1000Z"
            fill={colors.tree} opacity="0.12" />
          <path d="M0,650 Q300,580 700,620 Q1100,560 1500,610 Q1900,570 2300,600 Q2700,550 3100,620 Q3500,570 3900,590 Q4200,560 4400,610 L4400,1000 L0,1000Z"
            fill={colors.tree} opacity="0.08" />
          {/* Far trees */}
          <g color={colors.tree} opacity="0.5">
          {farTrees.map((t, i) => {
            const cx = t.x * 44; const cy = t.y * 10; const ss = t.s * 4.5;
            return treeRenderer(t.type, cx, cy, ss, i);
          })}
          </g>
        </svg>
      </div>

      {/* ── Layer 3: Mid-ground ── */}
      <div className="park-layer" style={{
        transform: `translateX(${-scrollX * MID}px)`,
        width: '480vw', left: '-40vw',
        background: 'transparent', zIndex: 2,
      }}>
        <svg viewBox="0 0 4800 1000" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <g color={colors.tree} opacity="0.7">
          {midTrees.map((t, i) => {
            const cx = t.x * 48; const cy = t.y * 10; const ss = t.s * 5.5;
            return treeRenderer(t.type, cx, cy, ss, i);
          })}
          </g>
          {/* Mid-ground mist */}
          <rect x="0" y="620" width="4800" height="380" fill={colors.mist} />
        </svg>
      </div>

      {/* ── Layer 4: Ground + near trees ── */}
      <div className="park-layer" style={{
        transform: `translateX(${-scrollX * NEAR}px)`,
        width: '520vw', left: '-60vw',
        background: colors.ground, zIndex: 3,
      }}>
        <svg viewBox="0 0 5200 1000" preserveAspectRatio="none" style={{ width: '100%', height: '100%', marginTop: '42vh' }}>
          <g color={colors.tree}>
          {nearTrees.map((t, i) => {
            const cx = t.x * 52; const cy = (t.y - 52) * 10; const ss = t.s * 6;
            return treeRenderer(t.type, cx, cy, ss, i);
          })}
          </g>
        </svg>
      </div>

      {/* ── Layer 5: Foreground elements (faster than scroll) ── */}
      <div className="park-layer" style={{
        transform: `translateX(${-scrollX * FRONT}px)`,
        width: '560vw', left: '-80vw', zIndex: 10,
      }}>
        {/* Foreground grass/bushes very close to camera */}
        <svg viewBox="0 0 5600 1000" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          {Array.from({length: 20}, (_, i) => (
            <BushSilhouette key={i} cx={i * 280 + Math.random() * 200} cy={680 + Math.random() * 200} s={35 + Math.random() * 40} />
          ))}
        </svg>
      </div>

      {/* ── God rays (light shafts) ── */}
      <div className="park-layer" style={{
        left: 0, right: 0, zIndex: 4,
        background: `radial-gradient(ellipse 80% 60% at 50% 15%, ${colors.light} 0%, transparent 65%)`,
        animation: 'godRays 12s ease-in-out infinite',
      }} />

      {/* ── Fog / mist overlay ── */}
      <div className="park-layer" style={{
        left: 0, right: 0, bottom: 0, height: '35vh', zIndex: 5,
        background: `linear-gradient(0deg, rgba(255,255,255,0.04) 0%, transparent 100%)`,
      }} />

      {/* ── Vignette ── */}
      <div className="park-layer" style={{
        left: 0, right: 0, zIndex: 6,
        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.35) 100%)',
      }} />

      {/* ── Film grain ── */}
      <div className="park-layer" style={{
        left: 0, right: 0, zIndex: 7, opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* ── CSS keyframes for god rays ── */}
      <style>{`
        @keyframes godRays {
          0%, 100% { opacity: 0.6; }
          25% { opacity: 0.8; }
          50% { opacity: 0.5; }
          75% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
