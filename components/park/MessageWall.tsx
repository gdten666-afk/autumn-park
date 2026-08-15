'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Message } from '@/lib/types';

interface MessageWallProps {
  mode?: 'panel' | 'page';
}

const COLOR_DOT: Record<string, string> = {
  amber: '#c98a4b', rose: '#b56a4c', sky: '#8faeb8', violet: '#9b8fb8', emerald: '#8fa184', slate: '#9aa3ad',
};

function MessageCard({ m, onDelete, onLike }: { m: Message; onDelete: (id: string) => void; onLike: (id: string) => void }) {
  return (
    <div className="note-card" style={{
      transform: `rotate(${m.id.length % 2 === 0 ? -0.8 : 0.6}deg)`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, flex: 'none',
        background: COLOR_DOT[m.color] || '#c98a4b' }} />
      <div style={{ flex: 1 }}>
        <p className="m-0 text-[13px] leading-[1.8]" style={{ color: 'var(--ink-soft)' }}>{m.content}</p>
        <p className="m-0 mt-1 text-[10px]" style={{ color: 'var(--ink-weak)' }}>{m.created_at?.replace('T', ' ').slice(0, 16)}</p>
      </div>
      <button
        type="button"
        aria-pressed={Boolean(m.likedByMe)}
        aria-label={m.likedByMe ? '取消点赞' : '点赞'}
        onClick={e => { e.stopPropagation(); onLike(m.id); }}
        className="flex-none flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 transition-colors"
        style={{ color: m.likedByMe ? 'var(--accent)' : 'var(--ink-weak)', background: 'transparent' }}
      >
        ♥ {m.likes && m.likes > 0 ? m.likes : ''}
      </button>
      {m.canDelete && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            if (window.confirm('删除这条留言？')) onDelete(m.id);
          }}
          className="flex-none text-[11px] leading-none rounded-full px-1.5 py-0.5 transition-colors"
          style={{ color: 'var(--ink-weak)', background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#b0563c')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-weak)')}
          title="删除留言（管理员）"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default function MessageWall({ mode = 'panel' }: MessageWallProps) {
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
    let t: ReturnType<typeof setInterval> | null = setInterval(fetchMessages, 30000);
    const onVis = () => {
      if (document.hidden) {
        if (t) { clearInterval(t); t = null; }
      } else if (!t) {
        t = setInterval(fetchMessages, 30000);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(t0);
      if (t) clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
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
      window.dispatchEvent(new CustomEvent('messages-changed'));
    } else {
      setError(data.status === 401 ? '登录后才能留言' : (data.error || '发送失败'));
    }
    setPosting(false);
  };

  const deleteMessage = async (id: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        window.dispatchEvent(new CustomEvent('messages-changed'));
      }
      else window.alert(d.error || '删除失败，请确认你有管理员权限');
    } catch {}
  };

  const handleLike = async (id: string) => {
    try {
      const res = await fetch('/api/messages/like', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, likes: d.data.likes, likedByMe: d.data.liked } : m));
        window.dispatchEvent(new CustomEvent('messages-changed'));
      } else if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('need-login'));
      }
    } catch {}
  };

  const renderInput = () => (
    <div>
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
      {error && <p className="text-[10px] mt-1.5" style={{ color: '#b0563c' }}>{error}</p>}
    </div>
  );

  // 独立页面模式（移动端）：整页展示，不被公园底部控件遮挡
  if (mode === 'page') {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100dvh - 53px)' }}>
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <p className="text-xs" style={{ color: 'var(--ink-weak)' }}>墙上还没有留言</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--ink-weak)' }}>写下第一张纸条吧</p>
              </div>
            )}
            {messages.map(m => (
              <MessageCard key={m.id} m={m} onDelete={deleteMessage} onLike={handleLike} />
            ))}
          </div>
        </div>
        <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--hairline)', background: 'var(--surface)' }}>
          {renderInput()}
        </div>
      </div>
    );
  }

  // 面板模式（桌面端）：右侧固定面板；移动端用链接跳转到独立留言页
  return (
    <>
      <Link href="/wall" className="chip fixed md:hidden z-30" style={{ right: 8, bottom: 8 }}>
        💬 留言墙
      </Link>

      <aside aria-label="留言墙" className="reveal fixed pointer-events-auto hidden md:flex" style={{
        right: 0, top: 0, bottom: 0, width: 'var(--panel-w)',
        zIndex: 15, flexDirection: 'column',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--surface)', borderLeft: '1px solid var(--hairline)' }} />

        <div className="relative p-5 pb-2 flex-shrink-0">
          <h2 className="text-base font-serif tracking-wider text-center" style={{ color: 'var(--ink)' }}>留言墙</h2>
          <p className="text-[10px] text-center mt-0.5" style={{ color: 'var(--ink-weak)' }}>把想说的话留在这里 · 匿名</p>
        </div>

        <div ref={listRef} className="relative flex-1 overflow-y-auto px-4 py-2" style={{ maskImage: 'linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
          <div className="columns-2 gap-3">
            {messages.length === 0 && (
              <div className="text-center py-8 col-span-2">
                <p className="text-xs" style={{ color: 'var(--ink-weak)' }}>墙上还没有留言</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--ink-weak)' }}>写下第一张纸条吧</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className="break-inside-avoid mb-3">
                <MessageCard m={m} onDelete={deleteMessage} onLike={handleLike} />
              </div>
            ))}
          </div>
        </div>

        <div className="relative p-4 flex-shrink-0">
          {renderInput()}
        </div>
      </aside>
    </>
  );
}
