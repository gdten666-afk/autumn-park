'use client';

import { useEffect, useState } from 'react';

export default function StatsBar() {
  const [stats, setStats] = useState<{ users: number; photos: number; messages: number; votes: Record<string,number> } | null>(null);

  useEffect(() => {
    const load = () => fetch('/api/stats').then(r => r.json()).then(d => { if (d.ok) setStats(d.data); }).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  if (!stats) return null;

  const voteTotal = Object.values(stats.votes || {}).reduce((a,b) => a+b, 0);
  const weatherEmoji: Record<string,string> = { sunny:'☀️', cloudy:'☁️', 'light-rain':'🌧', 'heavy-rain':'⛈', fog:'🌫', snow:'❄️' };

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none max-md:top-2 md:top-16">
      <div className="chip" style={{ gap: 16 }}>
        <span style={{ color: 'var(--ink-soft)' }}>👥 <b style={{ color: 'var(--ink)' }}>{stats.users}</b></span>
        <span style={{ color: 'var(--ink-soft)' }}>🖼 <b style={{ color: 'var(--ink)' }}>{stats.photos}</b></span>
        <span style={{ color: 'var(--ink-soft)' }}>💬 <b style={{ color: 'var(--ink)' }}>{stats.messages}</b></span>
        {voteTotal > 0 && (
          <span style={{ color: 'var(--ink-weak)' }}>
            今日投票 <b style={{ color: 'var(--ink-soft)' }}>{voteTotal}</b>
            {Object.entries(stats.votes || {}).slice(0,2).map(([k,v]) => (
              <span key={k} className="ml-1">{weatherEmoji[k]||k}{v}</span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
