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
  const [loginInviteCode, setLoginInviteCode] = useState('');
  const [useInviteLogin, setUseInviteLogin] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (useInviteLogin) {
      if (!loginName.trim() || !loginInviteCode.trim()) { setError('请填写名字和邀请码'); return; }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: loginName.trim(), inviteCode: loginInviteCode.trim() }),
        });
        const data = await res.json();
        if (data.ok) onLogin(data.data); else setError(data.error || '登录失败');
      } catch { setError('网络错误，请稍后重试'); }
      setLoading(false);
      return;
    }
    if (!loginName.trim() || !loginPassword) {
      setError('请填写名字和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: loginName.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (data.ok) onLogin(data.data); else setError(data.error || '登录失败');
    } catch { setError('网络错误，请稍后重试'); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regInviteCode.trim()) {
      setError('请填写名字和邀请码');
      return;
    }
    if (!regPassword || regPassword.length < 8) {
      setError('密码至少8位');
      return;
    }
    if (regPassword !== regConfirm) {
      setError('两次密码不一致');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName.trim(), inviteCode: regInviteCode.trim(), password: regPassword }),
      });
      const data = await res.json();
      if (data.ok) onLogin(data.data); else setError(data.error || '注册失败');
    } catch { setError('网络错误，请稍后重试'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center animate-fadeIn" onClick={onClose}>
      <div className="glass-strong p-6 w-80 max-w-[90vw] animate-slideUp" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg mb-4 text-center font-serif tracking-wider" style={{ color: 'var(--ink)' }}>进入公园</h2>

        {/* Tabs */}
        <div className="flex mb-4" style={{ borderBottom: '1px solid var(--hairline)' }}>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 pb-2 text-sm transition-colors ${tab === 'login' ? 'text-[var(--ink)]' : 'text-[var(--ink-weak)]'}`}
            style={{ borderBottom: tab === 'login' ? '2px solid var(--accent)' : '2px solid transparent' }}
          >
            登录
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 pb-2 text-sm transition-colors ${tab === 'register' ? 'text-[var(--ink)]' : 'text-[var(--ink-weak)]'}`}
            style={{ borderBottom: tab === 'register' ? '2px solid var(--accent)' : '2px solid transparent' }}
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
            {useInviteLogin ? (
              <>
                <input
                  type="text"
                  placeholder="邀请码"
                  value={loginInviteCode}
                  onChange={e => setLoginInviteCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="glass-input mb-3"
                />
                <p className="text-xs mb-3" style={{ color: 'var(--ink-weak)' }}>用邀请码登录不需要密码</p>
              </>
            ) : (
              <input
                type="password"
                placeholder="密码"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="glass-input mb-3"
              />
            )}
            {error && <p className="text-xs mb-3" style={{ color: '#b0563c' }}>{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full btn-primary disabled:opacity-30"
            >
              {useInviteLogin ? '用邀请码登录' : '登录'}
            </button>
            <button
              onClick={() => { setUseInviteLogin(!useInviteLogin); setError(''); }}
              className="w-full mt-2 text-xs transition-colors hover:text-[var(--ink-soft)]"
              style={{ color: 'var(--ink-weak)' }}
            >
              {useInviteLogin ? '← 用密码登录' : '用邀请码登录'}
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
              placeholder="设置密码（至少8位）"
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
            {error && <p className="text-xs mb-3" style={{ color: '#b0563c' }}>{error}</p>}
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
          <p className="text-xs text-center mt-3" style={{ color: 'var(--ink-weak)' }}>
            需要邀请码才能注册
          </p>
        )}
      </div>
    </div>
  );
}
