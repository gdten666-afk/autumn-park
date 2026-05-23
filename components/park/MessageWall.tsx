'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Message {
  id: string;
  content: string;
  color: string;
  created_at: string;
}

const NOTE_COLORS = [
  { bg: 'rgba(255,248,225,0.92)', text: '#5d4037', shadow: 'rgba(0,0,0,0.2)' },
  { bg: 'rgba(240,244,248,0.9)', text: '#37474f', shadow: 'rgba(0,0,0,0.15)' },
  { bg: 'rgba(255,240,245,0.9)', text: '#6d4c41', shadow: 'rgba(0,0,0,0.18)' },
  { bg: 'rgba(240,255,240,0.88)', text: '#3e4a3c', shadow: 'rgba(0,0,0,0.16)' },
  { bg: 'rgba(255,250,240,0.9)', text: '#5d4e37', shadow: 'rgba(0,0,0,0.14)' },
];

export default function MessageWall() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try { const res = await fetch('/api/messages'); const data = await res.json(); if (data.ok) setMessages(data.data); } catch {}
  }, []);

  useEffect(() => { fetchMessages(); const t = setInterval(fetchMessages, 30000); return () => clearInterval(t); }, [fetchMessages]);

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
    } else { setError(data.error || '发送失败'); }
    setPosting(false);
  };

  return (
    <div className="fixed pointer-events-auto" style={{
      right: 0, top: 0, bottom: 0, width: '280px',
      zIndex: 15, display: 'flex', flexDirection: 'column',
    }}>
      {/* Wall background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(/assets/scene/stone-wall.jpg)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.7) contrast(1.1) saturate(0.5)',
      }} />
      {/* Light overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,250,240,0.5) 0%, rgba(255,248,235,0.35) 50%, rgba(255,250,240,0.55) 100%)' }} />
      {/* Vignette edges */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '12%', background: 'linear-gradient(180deg, rgba(255,250,240,0.7) 0%, transparent 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%', background: 'linear-gradient(0deg, rgba(255,250,240,0.7) 0%, transparent 100%)' }} />

      {/* Header */}
      <div className="relative p-5 pb-2 flex-shrink-0">
        <h2 className="text-black/45 text-base font-serif tracking-wider text-center">留言墙</h2>
        <p className="text-black/25 text-[10px] text-center mt-0.5">把想说的话留在这里 · 匿名</p>
      </div>

      {/* Messages — pinned notes */}
      <div ref={listRef} className="relative flex-1 overflow-y-auto px-4 py-2" style={{ maskImage: 'linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
        <div className="columns-2 gap-3">
          {messages.length === 0 && (
            <div className="text-center py-8 col-span-2">
              <p className="text-white/15 text-xs">墙上还没有留言</p>
              <p className="text-white/08 text-[10px] mt-1">写下第一张纸条吧</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const style = NOTE_COLORS[i % NOTE_COLORS.length];
            const rots = ['-1.5deg','0.8deg','-0.5deg','1.2deg','-0.8deg','1.5deg'];
            const rotation = rots[i % rots.length];
            return (
              <div key={msg.id} className="break-inside-avoid mb-3"
                style={{
                  background: style.bg,
                  color: style.text,
                  padding: '12px 14px 10px',
                  borderRadius: '2px 12px 2px 12px',
                  boxShadow: `1px 2px 6px ${style.shadow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                  transform: `rotate(${rotation}deg)`,
                  fontSize: '11px',
                  lineHeight: '1.6',
                  position: 'relative',
                  fontFamily: "'Noto Serif SC', Georgia, serif",
                }}
              >
                {/* Pin */}
                <div style={{
                  position: 'absolute', top: -4, left: '50%', marginLeft: -3,
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(180,80,60,0.8), rgba(120,40,30,0.6))',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }} />
                <p>{msg.content}</p>
                <p style={{ fontSize: '8px', color: 'inherit', opacity: 0.35, marginTop: 6, textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            );
          })}
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
  );
}
