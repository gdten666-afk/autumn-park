'use client';

import { useEffect, useRef } from 'react';
import { getSeasonState } from '@/lib/seasons';
import type { SeasonState } from '@/lib/types';

interface ParkCanvasProps {
  children: React.ReactNode;
  onSeasonChange: (state: SeasonState) => void;
}

export default function ParkCanvas({ children, onSeasonChange }: ParkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSeasonChange(getSeasonState());
    const interval = setInterval(() => onSeasonChange(getSeasonState()), 3600000);
    return () => clearInterval(interval);
  }, [onSeasonChange]);

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
