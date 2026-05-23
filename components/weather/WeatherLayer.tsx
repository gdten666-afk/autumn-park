// components/weather/WeatherLayer.tsx
'use client';

import type { Weather } from '@/lib/types';

interface WeatherLayerProps {
  weather: Weather;
}

export default function WeatherLayer({ weather }: WeatherLayerProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-5">
      {weather === 'sunny' && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-200/5 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/3 w-64 h-64 bg-yellow-100/5 rounded-full blur-2xl" />
        </>
      )}
      {weather === 'fog' && (
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
      )}
      {(weather === 'light-rain' || weather === 'heavy-rain') && (
        <div className="absolute inset-0 bg-black/10" />
      )}
      {weather === 'snow' && (
        <div className="absolute inset-0 bg-white/5" />
      )}
    </div>
  );
}
