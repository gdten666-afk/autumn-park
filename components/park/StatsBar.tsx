'use client';

import { useEffect, useState } from 'react';

export default function StatsBar() {
  const [stats, setStats] = useState<{ users: number; photos: number; messages: number; votes: Record<string,number> } | null>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.ok) setStats(d.data); });
    const t = setInterval(() => {
      fetch('/api/stats').then(r => r.json()).then(d => { if (d.ok) setStats(d.data); });
    }, 30000);
    return () => clearInterval(t);
  }, []);

  if (!stats) return null;

  const voteTotal = Object.values(stats.votes || {}).reduce((a,b) => a+b, 0);
  const weatherEmoji: Record<string,string> = { sunny:'☀️', cloudy:'☁️', 'light-rain':'🌧', 'heavy-rain':'⛈', fog:'🌫', snow:'❄️' };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="glass flex items-center gap-4 px-4 py-1.5 text-[10px]">
        <span className="text-black/30">👥 <span className="text-black/50">{stats.users}</span></span>
        <span className="text-black/30">🖼 <span className="text-black/50">{stats.photos}</span></span>
        <span className="text-black/30">💬 <span className="text-black/50">{stats.messages}</span></span>
        {voteTotal > 0 && (
          <span className="text-black/20">
            今日投票 <span className="text-black/40">{voteTotal}</span>
            {Object.entries(stats.votes || {}).slice(0,2).map(([k,v]) => (
              <span key={k} className="ml-1">{weatherEmoji[k]||k}{v}</span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
