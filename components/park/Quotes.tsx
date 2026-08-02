'use client';

import { QUOTES } from '@/lib/constants';

const ROTS = ['-2deg','1.2deg','-1.5deg','0.8deg','-0.5deg','1.8deg','-1deg','0.3deg'];
const TINTS = [
  'bg-amber-50/40', 'bg-rose-50/35', 'bg-sky-50/38', 'bg-stone-50/42',
  'bg-teal-50/32', 'bg-yellow-50/36', 'bg-orange-50/34', 'bg-violet-50/30',
];

export default function Quotes() {
  return (
    <div className="relative w-full py-16 pointer-events-none" style={{ maxWidth: 'calc(100vw - 320px)', marginLeft: '4vw', zIndex: 15 }}>
      <div className="mb-6">
        <h2 className="text-black/45 text-xs tracking-[0.2em] font-serif">文字角落</h2>
      </div>
      <div className="flex flex-wrap gap-3 md:gap-5 max-w-3xl">
        {QUOTES.map((q, i) => {
          const rot = ROTS[i % ROTS.length];
          const tint = TINTS[i % TINTS.length];
          const mt = (i * 17) % 30 - 8;
          return (
            <div key={i} className="pointer-events-auto"
              style={{
                transform: `rotate(${rot})`,
                marginTop: mt,
                flexBasis: `clamp(160px, ${40 + (i % 3) * 8}vw, ${220 + (i % 3) * 30}px)`,
                flexGrow: 1,
              }}>
              <div className={`${tint} backdrop-blur-sm border border-black/5 rounded-2xl p-3 md:p-4 shadow-sm`}>
                <p className="text-black/55 text-[13px] md:text-sm leading-relaxed font-serif mb-1.5 md:mb-2">
                  「{q.text}」
                </p>
                <p className="text-[9px] md:text-[10px] tracking-wider" style={{ color: 'var(--ink-faint)' }}>
                  —— {q.source}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
