'use client';

import { useState, useEffect } from 'react';
import type { Weather } from '@/lib/types';
import { WEATHERS } from '@/lib/constants';

interface VoteData {
  today: Weather;
  tomorrow: Weather;
  voteDate: string;
  voteCounts: Record<string, number>;
  totalVotes: number;
  userVote: string | null;
}

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = DAY_NAMES[d.getDay()];
  return `${m}月${day}日 ${wd}`;
}

export default function WeatherVote() {
  const [data, setData] = useState<VoteData | null>(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const [loadError, setLoadError] = useState(false);

  const fetchData = async () => {
    setLoadError(false);
    // Retry up to 3 times — Render free tier cold starts are slow
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch('/api/weather/vote');
        const d = await res.json();
        if (d.ok) { setData(d.data); return; }
      } catch {}
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000 * attempt));
    }
    setLoadError(true);
  };

  useEffect(() => {
    const t = setTimeout(fetchData, 0);
    return () => clearTimeout(t);
  }, []);

  const handleVote = async (vote: Weather) => {
    if (voting) return;
    setVoting(true);
    setError('');

    const res = await fetch('/api/weather/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
    });
    const d = await res.json();
    if (d.ok) {
      fetchData();
    } else {
      setError(d.error === 'Login required' ? '登录后才能投票' : (d.error || '投票失败'));
    }
    setVoting(false);
  };

  if (!data) {
    if (loadError) {
      return (
        <div className="fixed bottom-4 left-4 z-25 max-md:bottom-16 max-md:left-2">
          <button onClick={fetchData} className="glass-btn flex items-center gap-1 !px-3 !py-1.5 text-xs">
            <span className="text-black/30">🌤 加载失败，点击重试</span>
          </button>
        </div>
      );
    }
    return (
      <div className="fixed bottom-4 left-4 z-25 max-md:bottom-16 max-md:left-2">
        <div className="glass-btn flex items-center gap-1 !px-3 !py-1.5 text-xs">
          <span className="w-3 h-3 border-2 border-black/15 border-t-black/30 rounded-full animate-spin" />
          <span className="text-black/25">天气</span>
        </div>
      </div>
    );
  }

  const todayW = WEATHERS.find(w => w.value === data.today);
  const tomorrowW = WEATHERS.find(w => w.value === data.tomorrow);
  const maxVotes = Math.max(1, ...Object.values(data.voteCounts));
  const todayLabel = formatDate(data.voteDate);

  return (
    <div className="fixed bottom-4 left-4 z-25 flex flex-col items-start gap-2 max-md:bottom-16 max-md:left-2">
      {/* Compact collapsed button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="glass-btn flex items-center gap-2 !px-3 !py-1.5 text-xs"
        title="天气投票"
      >
        <span className="text-base">{todayW?.emoji}</span>
        <span className="text-black/30 hidden md:inline">{todayLabel}</span>
        <span className="text-black/20 text-[10px] hidden md:inline">|</span>
        <span className="text-sm">{tomorrowW?.emoji}</span>
        <span className="text-black/30 hidden md:inline">明日</span>
        {data.totalVotes > 0 && (
          <span className="text-black/20 text-[10px] ml-0.5">{data.totalVotes}票</span>
        )}
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="glass-strong p-4 min-w-[210px] max-w-[calc(100vw-2rem)] animate-slideUp"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-black/40 text-xs tracking-wider">天气投票</h3>
              <p className="text-black/20 text-[10px] mt-0.5">{todayLabel}</p>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-black/20 hover:text-black/50 text-xs transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Today + Tomorrow */}
          <div className="flex items-center justify-center gap-4 mb-3 pb-3 border-b border-black/5">
            <div className="text-center">
              <p className="text-black/25 text-[10px] mb-1">今日</p>
              <span className="text-3xl">{todayW?.emoji}</span>
              <p className="text-black/30 text-[10px] mt-0.5">{todayW?.label}</p>
            </div>
            <div className="text-black/15 text-sm">→</div>
            <div className="text-center">
              <p className="text-black/25 text-[10px] mb-1">明日预测</p>
              <span className="text-3xl">{tomorrowW?.emoji}</span>
              <p className="text-black/30 text-[10px] mt-0.5">{tomorrowW?.label}</p>
            </div>
          </div>

          {/* Vote options */}
          <div className="space-y-1.5">
            {WEATHERS.map(w => {
              const count = data.voteCounts[w.value] || 0;
              const barWidth = maxVotes > 0 ? (count / maxVotes) * 100 : 0;
              const isSelected = data.userVote === w.value;
              return (
                <button
                  key={w.value}
                  onClick={() => handleVote(w.value)}
                  disabled={voting}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all
                    ${isSelected ? 'bg-amber-100/60 ring-1 ring-amber-200/50' : 'hover:bg-white/50'}
                    ${data.userVote && !isSelected ? 'opacity-50' : ''}
                  `}
                >
                  <span className="text-base w-6 text-center flex-shrink-0">{w.emoji}</span>
                  <span className="text-black/40 w-7 flex-shrink-0">{w.label}</span>
                  <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-300/60 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-black/25 text-[10px] w-5 text-right flex-shrink-0">{count}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="text-red-400/60 text-[10px] mt-2 text-center">{error}</p>
          )}

          {!data.userVote && !error && (
            <p className="text-black/15 text-[10px] mt-2 text-center">
              点击天气图标投票明天的天气
            </p>
          )}

          {data.userVote && (
            <p className="text-amber-500/60 text-[10px] mt-2 text-center">
              已投票 ✓
            </p>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {expanded && (
        <div className="fixed inset-0 z-20" onClick={() => setExpanded(false)} />
      )}
    </div>
  );
}
