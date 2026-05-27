'use client';

import { QUOTES } from '@/lib/constants';

export default function Quotes() {
  return (
    <div className="relative w-full py-16 pointer-events-none" style={{ maxWidth: 'calc(100vw - 320px)', marginLeft: '4vw', zIndex: 15 }}>
      <div className="mb-6">
        <h2 className="text-black/20 text-xs tracking-[0.2em] font-serif">文字角落</h2>
      </div>
      <div className="columns-1 md:columns-2 gap-8 max-w-2xl">
        {QUOTES.map((q, i) => (
          <div key={i} className="break-inside-avoid mb-6 pointer-events-auto"
            style={{
              transform: `rotate(${['-1deg','0.5deg','-0.3deg','0.8deg'][i % 4]})`,
            }}>
            <p className="text-black/35 text-sm leading-relaxed font-serif italic mb-1.5">
              「{q.text}」
            </p>
            <p className="text-black/15 text-[10px] tracking-wider">
              —— {q.source}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
