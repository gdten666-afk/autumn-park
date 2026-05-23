'use client';

import { useState, useEffect } from 'react';
import type { Weather } from '@/lib/types';

const WEATHERS: { value: Weather; label: string; emoji: string }[] = [
  { value: 'sunny', label: '晴', emoji: '☀️' },
  { value: 'cloudy', label: '多云', emoji: '☁️' },
  { value: 'light-rain', label: '小雨', emoji: '🌧' },
  { value: 'heavy-rain', label: '大雨', emoji: '⛈' },
  { value: 'fog', label: '雾', emoji: '🌫' },
  { value: 'snow', label: '雪', emoji: '❄️' },
];

export default function WeatherVote() {
  const [today, setToday] = useState<Weather>('sunny');
  const [tomorrow, setTomorrow] = useState<Weather>('sunny');
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetch('/api/weather/today').then(r => r.json()).then(d => { if (d.ok) setToday(d.data.weather); });
    fetch('/api/weather/tomorrow').then(r => r.json()).then(d => { if (d.ok) setTomorrow(d.data.weather); });
  }, []);

  const handleVote = async (vote: Weather) => {
    if (voted) return;
    setVoting(true);
    const res = await fetch('/api/weather/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
    });
    const data = await res.json();
    if (data.ok) { setVoted(true); setTomorrow(vote); }
    setVoting(false);
  };

  const TodayIcon = WEATHERS.find(w => w.value === today);
  const TomorrowIcon = WEATHERS.find(w => w.value === tomorrow);

  return (
    <div className="fixed bottom-4 left-4 z-30 glass-strong p-4 text-sm min-w-[160px] animate-slideUp">
      {/* Today */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/35 text-xs">今日</span>
        <span className="text-2xl">{TodayIcon?.emoji}</span>
      </div>

      {/* Tomorrow */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
        <span className="text-white/35 text-xs">明日</span>
        <span className="text-2xl">{TomorrowIcon?.emoji}</span>
      </div>

      {/* Vote section */}
      {!voted ? (
        <div>
          <p className="text-white/20 text-[10px] mb-2 text-center">投票明天的天气</p>
          <div className="flex justify-center gap-1.5">
            {WEATHERS.map(w => (
              <button
                key={w.value}
                onClick={() => handleVote(w.value)}
                disabled={voting}
                className="text-lg hover:scale-125 transition-transform disabled:opacity-30 p-0.5"
                title={w.label}
              >
                {w.emoji}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-white/20 text-[10px] text-center">已投票 ✓</p>
      )}
    </div>
  );
}
