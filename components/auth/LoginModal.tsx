// components/auth/LoginModal.tsx
'use client';

import { useState } from 'react';
import type { UserSession } from '@/lib/types';

interface LoginModalProps {
  onLogin: (session: UserSession) => void;
  onClose: () => void;
}

export default function LoginModal({ onLogin, onClose }: LoginModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login fields
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginName.trim() || !loginPassword) {
      setError('请填写名字和密码');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: loginName.trim(), password: loginPassword }),
    });
    const data = await res.json();

    if (data.ok) {
      onLogin(data.data);
    } else {
      setError(data.error || '登录失败');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regInviteCode.trim()) {
      setError('请填写名字和邀请码');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setError('密码至少4位');
      return;
    }
    if (regPassword !== regConfirm) {
      setError('两次密码不一致');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: regName.trim(), inviteCode: regInviteCode.trim(), password: regPassword }),
    });
    const data = await res.json();

    if (data.ok) {
      onLogin(data.data);
    } else {
      setError(data.error || '注册失败');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fadeIn" onClick={onClose}>
      <div className="glass-strong p-6 w-80 max-w-[90vw] animate-slideUp" onClick={e => e.stopPropagation()}>
        <h2 className="text-white/80 text-lg mb-4 text-center font-serif tracking-wider">进入公园</h2>

        {/* Tabs */}
        <div className="flex mb-4 border-b border-white/10">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 pb-2 text-sm transition-colors ${
              tab === 'login' ? 'text-white border-b-2 border-white/50' : 'text-white/30'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 pb-2 text-sm transition-colors ${
              tab === 'register' ? 'text-white border-b-2 border-white/50' : 'text-white/30'
            }`}
          >
            注册
          </button>
        </div>

        {tab === 'login' ? (
          <>
            <input
              type="text"
              placeholder="你的名字"
              value={loginName}
              onChange={e => setLoginName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="glass-input mb-3"
            />
            <input
              type="password"
              placeholder="密码"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="glass-input mb-3"
            />
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full btn-primary disabled:opacity-30"
            >
              登录
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="你的名字"
              value={regName}
              onChange={e => setRegName(e.target.value)}
              className="glass-input mb-3"
            />
            <input
              type="password"
              placeholder="设置密码（至少4位）"
              value={regPassword}
              onChange={e => setRegPassword(e.target.value)}
              className="glass-input mb-3"
            />
            <input
              type="password"
              placeholder="确认密码"
              value={regConfirm}
              onChange={e => setRegConfirm(e.target.value)}
              className="glass-input mb-3"
            />
            <input
              type="text"
              placeholder="邀请码"
              value={regInviteCode}
              onChange={e => setRegInviteCode(e.target.value)}
              className="glass-input mb-3"
            />
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full btn-primary disabled:opacity-30"
            >
              注册
            </button>
          </>
        )}

        {tab === 'register' && (
          <p className="text-white/20 text-xs text-center mt-3">
            需要邀请码才能注册
          </p>
        )}
      </div>
    </div>
  );
}
