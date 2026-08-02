'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Message {
  id: string;
  content: string;
  color: string;
  created_at: string;
}

export default function MessageWall() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try { const res = await fetch('/api/messages'); const data = await res.json(); if (data.ok) setMessages(data.data); } catch {}
  }, []);

  useEffect(() => {
    const t0 = setTimeout(fetchMessages, 0);
    const t = setInterval(fetchMessages, 30000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [fetchMessages]);

  const handlePost = async () => {
    if (!input.trim()) return;
    if (input.length > 500) { setError('最多500字'); return; }
    setPosting(true); setError('');
    const res = await fetch('/api/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessages(prev => [data.data, ...prev]);
      setInput('');
    } else {
      setError(data.status === 401 ? '登录后才能留言' : (data.error || '发送失败'));
    }
    setPosting(false);
  };

  // 移动端默认收起留言墙，避免遮挡公园内容；桌面端默认展开
  const [open, setOpen] = useState<boolean>(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 768
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen(!open)}
        className="chip fixed md:hidden z-30"
        style={{ right: 8, bottom: 80, cursor: 'pointer' }}>
        💬 {open ? '隐藏' : '留言墙'}
      </button>

      {/* Wall panel */}
      <div className={`reveal fixed pointer-events-auto ${open ? 'flex' : 'hidden'} md:flex`} style={{
        right: 0, top: 0, bottom: 0, width: 'min(280px, 85vw)',
        zIndex: 15, flexDirection: 'column',
      }}>
      {/* Wall background */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--surface)', borderLeft: '1px solid var(--hairline)' }} />

      {/* Header */}
      <div className="relative p-5 pb-2 flex-shrink-0">
        <h2 className="text-base font-serif tracking-wider text-center" style={{ color: 'var(--ink)' }}>留言墙</h2>
        <p className="text-[10px] text-center mt-0.5" style={{ color: 'var(--ink-weak)' }}>把想说的话留在这里 · 匿名</p>
      </div>

      {/* Messages — pinned notes */}
      <div ref={listRef} className="relative flex-1 overflow-y-auto px-4 py-2" style={{ maskImage: 'linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
        <div className="columns-2 gap-3">
          {messages.length === 0 && (
            <div className="text-center py-8 col-span-2">
              <p className="text-xs" style={{ color: 'var(--ink-weak)' }}>墙上还没有留言</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--ink-weak)' }}>写下第一张纸条吧</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="card-hover break-inside-avoid mb-3" style={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              boxShadow: 'var(--shadow-card)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, flex: 'none',
                background: { amber: '#c98a4b', rose: '#b56a4c', sky: '#8faeb8', violet: '#9b8fb8', emerald: '#8fa184', slate: '#9aa3ad' }[m.color] || '#c98a4b' }} />
              <div style={{ flex: 1 }}>
                <p className="m-0 text-[13px] leading-[1.8]" style={{ color: 'var(--ink-soft)' }}>{m.content}</p>
                <p className="m-0 mt-1 text-[10px]" style={{ color: 'var(--ink-weak)' }}>{m.created_at?.replace('T', ' ').slice(0, 16)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="relative p-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="写点什么..."
            maxLength={500}
            onKeyDown={e => { if (e.key === 'Enter') handlePost(); }}
            className="glass-input flex-1 text-xs"
            style={{ borderRadius: '10px', padding: '8px 12px' }}
          />
          <button onClick={handlePost} disabled={posting || !input.trim()}
            className="glass-btn text-xs flex-shrink-0 disabled:opacity-30">
            {posting ? '...' : '贴上'}
          </button>
        </div>
        {error && <p className="text-red-400/60 text-[10px] mt-1.5">{error}</p>}
      </div>
    </div>
    </>
  );
}
