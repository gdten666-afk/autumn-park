'use client';

import { useEffect, useRef, MutableRefObject } from 'react';
import { getSeasonState } from '@/lib/seasons';
import type { SeasonState } from '@/lib/types';

interface ParkCanvasProps {
  children: React.ReactNode;
  onSeasonChange: (state: SeasonState) => void;
  scrollRef: MutableRefObject<number>;
}

export default function ParkCanvas({ children, onSeasonChange, scrollRef }: ParkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSeasonChange(getSeasonState());
    const interval = setInterval(() => onSeasonChange(getSeasonState()), 3600000);
    return () => clearInterval(interval);
  }, [onSeasonChange]);

  // Direct DOM scroll → ref update, no React state involved
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => { scrollRef.current = el.scrollLeft; };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [scrollRef]);

  return (
    <div
      ref={containerRef}
      className="park-scroll-container w-full h-screen overflow-x-auto overflow-y-hidden relative"
      style={{
        background: 'var(--season-bg)',
        transition: 'background var(--transition-duration) ease',
      }}
    >
      <div className="relative h-full" style={{ width: '400vw', minWidth: '4000px' }}>
        {children}
      </div>
    </div>
  );
}
