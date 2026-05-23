// components/weather/WeatherVote.tsx
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
    if (data.ok) {
      setVoted(true);
      setTomorrow(vote);
    }
    setVoting(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-30 bg-black/40 backdrop-blur rounded-xl p-3 text-sm">
      <div className="text-white/50 text-xs mb-2">
        今日天气{' '}
        <span className="text-white/80">{WEATHERS.find(w => w.value === today)?.emoji}</span>
      </div>
      <div className="text-white/50 text-xs mb-2">
        明日天气{' '}
        <span className="text-white/80">{WEATHERS.find(w => w.value === tomorrow)?.emoji}</span>
      </div>

      {!voted && (
        <>
          <p className="text-white/30 text-[10px] mb-1">投票明天的天气：</p>
          <div className="flex gap-1">
            {WEATHERS.map(w => (
              <button
                key={w.value}
                onClick={() => handleVote(w.value)}
                disabled={voting}
                className="text-sm hover:scale-125 transition-transform disabled:opacity-50"
                title={w.label}
              >
                {w.emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
