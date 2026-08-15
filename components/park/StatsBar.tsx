'use client';

import { useEffect, useState } from 'react';

export default function StatsBar() {
  const [stats, setStats] = useState<{ users: number; photos: number; messages: number; votes: Record<string,number> } | null>(null);

  useEffect(() => {
    const load = () => fetch('/api/stats').then(r => r.json()).then(d => { if (d.ok) setStats(d.data); }).catch(() => {});
    load();
    let t: ReturnType<typeof setInterval> | null = setInterval(load, 30000);
    const onVis = () => {
      if (document.hidden) { if (t) { clearInterval(t); t = null; } }
      else if (!t) t = setInterval(load, 30000);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => { if (t) clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  if (!stats) return null;

  const voteTotal = Object.values(stats.votes || {}).reduce((a,b) => a+b, 0);

  return (
    <div className="hidden md:flex items-center" style={{ gap: 14, fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <span>👥 <b style={{ color: 'var(--ink)' }}>{stats.users}</b></span>
      <span>🖼 <b style={{ color: 'var(--ink)' }}>{stats.photos}</b></span>
      <span>💬 <b style={{ color: 'var(--ink)' }}>{stats.messages}</b></span>
      {voteTotal > 0 && (
        <span>今日投票 <b style={{ color: 'var(--ink)' }}>{voteTotal}</b></span>
      )}
    </div>
  );
}
