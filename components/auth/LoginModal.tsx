// components/auth/LoginModal.tsx
'use client';

import { useState } from 'react';
import type { UserSession } from '@/lib/types';

interface LoginModalProps {
  onLogin: (session: UserSession) => void;
  onClose: () => void;
}

export default function LoginModal({ onLogin, onClose }: LoginModalProps) {
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !inviteCode.trim()) {
      setError('请填写名字和邀请码');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), inviteCode: inviteCode.trim() }),
    });
    const data = await res.json();

    if (data.ok) {
      onLogin(data.data);
    } else {
      setError(data.error || '注册失败');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!inviteCode.trim()) {
      setError('请输入邀请码');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: inviteCode.trim() }),
    });
    const data = await res.json();

    if (data.ok) {
      onLogin(data.data);
    } else {
      setError(data.error || '登录失败');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#2c1810] border border-white/10 rounded-xl p-6 w-80 max-w-[90vw]" onClick={e => e.stopPropagation()}>
        <h2 className="text-white/80 text-lg mb-4 text-center">进入公园</h2>

        <input
          type="text"
          placeholder="你的名字（首次注册需要）"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded mb-3 text-white/80 placeholder:text-white/30 text-sm focus:outline-none focus:border-white/30"
        />

        <input
          type="text"
          placeholder="邀请码"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded mb-3 text-white/80 placeholder:text-white/30 text-sm focus:outline-none focus:border-white/30"
        />

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleRegister}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-sm text-white/80 transition-colors disabled:opacity-50"
          >
            注册
          </button>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/15 rounded text-sm text-white/60 transition-colors disabled:opacity-50"
          >
            登录
          </button>
        </div>

        <p className="text-white/20 text-xs text-center mt-3">
          已有邀请码可直接登录
        </p>
      </div>
    </div>
  );
}
