'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Message {
  id: string;
  content: string;
  color: string;
  created_at: string;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  amber:   { bg: 'rgba(180,130,60,0.12)',  border: 'rgba(180,130,60,0.25)',  text: 'rgba(220,190,140,0.9)' },
  rose:    { bg: 'rgba(180,80,100,0.12)',   border: 'rgba(180,80,100,0.25)',   text: 'rgba(220,160,170,0.9)' },
  sky:     { bg: 'rgba(80,140,180,0.12)',   border: 'rgba(80,140,180,0.25)',   text: 'rgba(160,200,220,0.9)' },
  violet:  { bg: 'rgba(130,100,180,0.12)',  border: 'rgba(130,100,180,0.25)',  text: 'rgba(200,180,220,0.9)' },
  emerald: { bg: 'rgba(80,150,120,0.12)',   border: 'rgba(80,150,120,0.25)',   text: 'rgba(160,210,180,0.9)' },
  slate:   { bg: 'rgba(130,140,160,0.12)',  border: 'rgba(130,140,160,0.25)',  text: 'rgba(200,210,220,0.9)' },
};

export default function MessageWall() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch('/api/messages');
    const data = await res.json();
    if (data.ok) setMessages(data.data);
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handlePost = async () => {
    if (!input.trim()) return;
    if (input.length > 500) { setError('最多500字'); return; }
    setPosting(true);
    setError('');
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessages(prev => [data.data, ...prev]);
      setInput('');
    } else {
      setError(data.error || '发送失败');
    }
    setPosting(false);
  };

  return (
    <div className="fixed pointer-events-auto" style={{ left: '30vw', top: '26vh', zIndex: 20 }}>
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="glass-btn flex items-center gap-2"
      >
        <span className="text-sm">💬</span>
        <span className="text-white/60 text-xs">心事墙</span>
        <span className="text-white/20 text-[10px]">{messages.length}</span>
      </button>

      {expanded && (
        <div className="absolute top-12 left-0 glass-strong p-4 w-80 max-h-[60vh] overflow-y-auto animate-slideUp">
          {/* Input */}
          <div className="mb-4">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="写下你的心事，匿名留言..."
              className="glass-input resize-none h-20 text-xs"
              maxLength={500}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-white/15 text-[10px]">{input.length}/500 · 匿名</span>
              <button onClick={handlePost} disabled={posting || !input.trim()} className="glass-btn text-xs disabled:opacity-30">
                {posting ? '...' : '留下心事'}
              </button>
            </div>
            {error && <p className="text-red-400 text-[10px] mt-1">{error}</p>}
          </div>

          {/* Messages */}
          <div className="space-y-2">
            {messages.length === 0 && (
              <p className="text-white/15 text-xs text-center py-4">还没有人留下心事，做第一个吧</p>
            )}
            {messages.map((msg, i) => {
              const c = COLOR_MAP[msg.color] || COLOR_MAP.slate;
              return (
                <div
                  key={msg.id}
                  className="rounded-xl p-3 text-xs leading-relaxed"
                  style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                    animation: `slideUp 0.4s ease both ${i * 0.03}s`,
                    transform: `rotate(${(Math.random() - 0.5) * 2}deg)`,
                  }}
                >
                  <p>{msg.content}</p>
                  <p className="text-white/15 text-[9px] mt-1.5">
                    {new Date(msg.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
