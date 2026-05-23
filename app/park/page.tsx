'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ParkCanvas from '@/components/park/ParkCanvas';
import type { SeasonState, Weather } from '@/lib/types';

const ParticleOverlay = dynamic(() => import('@/components/park/ParticleOverlay'), { ssr: false });

export default function ParkPage() {
  const [seasonState, setSeasonState] = useState<SeasonState>({
    season: 'autumn', transitionWeight: 0, secondarySeason: null,
  });
  const [weather, setWeather] = useState<Weather>('sunny');

  const handleSeasonChange = useCallback((state: SeasonState) => {
    setSeasonState(state);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ParkCanvas onSeasonChange={handleSeasonChange}>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-2xl text-white/60 tracking-widest" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            一个在秋天等花开的人
          </h1>
        </div>
      </ParkCanvas>
      <ParticleOverlay seasonState={seasonState} weather={weather} />
    </div>
  );
}
