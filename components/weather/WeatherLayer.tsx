// components/weather/WeatherLayer.tsx
'use client';

import type { Weather } from '@/lib/types';

interface WeatherLayerProps {
  weather: Weather;
}

export default function WeatherLayer({ weather }: WeatherLayerProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[5]">
      {/* Sunny: warm light spots */}
      {weather === 'sunny' && (
        <>
          <div className="absolute top-[8%] left-[45%] w-[30vw] h-[20vh] bg-yellow-100/20 rounded-full blur-3xl" />
          <div className="absolute top-[15%] right-[20%] w-[20vw] h-[15vh] bg-orange-100/15 rounded-full blur-2xl" />
          <div className="absolute top-[5%] left-[60%] w-[10vw] h-[10vh] bg-white/25 rounded-full blur-xl" />
        </>
      )}

      {/* Cloudy: grey cloud shapes */}
      {weather === 'cloudy' && (
        <>
          <div className="absolute top-[3%] left-[10%] w-[35vw] h-[12vh] bg-gray-300/25 rounded-full blur-3xl" />
          <div className="absolute top-[8%] right-[5%] w-[40vw] h-[10vh] bg-gray-400/20 rounded-full blur-2xl" />
          <div className="absolute top-[2%] left-[40%] w-[25vw] h-[8vh] bg-gray-300/30 rounded-full blur-xl" />
        </>
      )}

      {/* Rain: blue-grey wet effect */}
      {(weather === 'light-rain' || weather === 'heavy-rain') && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/15 via-slate-800/10 to-slate-700/5" />
          {/* Puddle shimmer */}
          <div className="absolute bottom-[15vh] left-[25%] w-[50vw] h-[2px] bg-blue-200/10 blur-sm rounded-full" />
          <div className="absolute bottom-[20vh] left-[40%] w-[30vw] h-[1px] bg-blue-200/8 blur-sm rounded-full" />
        </>
      )}

      {/* Snow: white frost glow */}
      {weather === 'snow' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-white/8" />
          <div className="absolute bottom-0 left-0 right-0 h-[5vh] bg-white/15 blur-md" />
          <div className="absolute top-[2%] left-[30%] w-[40vw] h-[8vh] bg-white/20 rounded-full blur-3xl" />
        </>
      )}

      {/* Fog: layered mist */}
      {weather === 'fog' && (
        <>
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[3px]" />
          <div className="absolute top-[10%] left-[5%] w-[45vw] h-[18vh] bg-white/25 rounded-full blur-3xl" style={{ animation: 'fogDrift 14s ease-in-out infinite' }} />
          <div className="absolute top-[30%] right-[10%] w-[40vw] h-[15vh] bg-white/20 rounded-full blur-3xl" style={{ animation: 'fogDrift 18s ease-in-out infinite reverse' }} />
          <div className="absolute top-[50%] left-[20%] w-[50vw] h-[12vh] bg-white/15 rounded-full blur-2xl" style={{ animation: 'fogDrift 16s ease-in-out infinite' }} />
        </>
      )}
    </div>
  );
}
