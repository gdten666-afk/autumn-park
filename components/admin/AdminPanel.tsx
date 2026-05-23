// components/admin/AdminPanel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [codes, setCodes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [count, setCount] = useState(5);
  const [generated, setGenerated] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/admin/invites').then(r => r.json()).then(d => { if (d.ok) setCodes(d.data); });
    fetch('/api/admin/users').then(r => r.json()).then(d => { if (d.ok) setUsers(d.data); });
  }, []);

  const generateCodes = useCallback(async () => {
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
    const data = await res.json();
    if (data.ok) {
      setGenerated(data.data.codes);
      const refresh = await fetch('/api/admin/invites').then(r => r.json());
      if (refresh.ok) setCodes(refresh.data);
    }
  }, [count]);

  const deleteUser = useCallback(async (userId: string, name: string) => {
    if (!confirm(`确定删除用户 ${name}？这将删除其所有照片和数据。`)) return;
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (data.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#1a1110] border border-white/10 rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white/80 text-lg">管理面板</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/60 text-sm">关闭</button>
        </div>

        {/* Invite code generation */}
        <section className="mb-6">
          <h3 className="text-white/60 text-sm mb-3">生成邀请码</h3>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={count}
              min={1}
              max={100}
              onChange={e => setCount(Number(e.target.value))}
              className="w-20 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/80 text-sm text-center"
            />
            <button
              onClick={generateCodes}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded text-sm text-amber-300/80 transition-colors"
            >
              生成
            </button>
          </div>

          {generated.length > 0 && (
            <div className="mt-3 p-3 bg-white/5 rounded">
              <p className="text-white/40 text-xs mb-1">新生成的邀请码：</p>
              {generated.map(code => (
                <code key={code} className="block text-green-400 text-xs font-mono">{code}</code>
              ))}
            </div>
          )}

          {codes.length > 0 && (
            <details className="mt-3">
              <summary className="text-white/30 text-xs cursor-pointer hover:text-white/50">历史邀请码 ({codes.length})</summary>
              <div className="mt-2 max-h-32 overflow-y-auto">
                {codes.map((c: any) => (
                  <div key={c.code} className="text-xs font-mono text-white/30 py-0.5">
                    {c.code} {c.used_by ? '(已使用)' : '(未使用)'}
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>

        {/* Delete all photos */}
        <section className="mb-6">
          <h3 className="text-white/60 text-sm mb-3">清空所有照片</h3>
          <button
            onClick={async () => {
              if (!confirm('确定要删除所有照片吗？此操作不可撤销！')) return;
              const res = await fetch('/api/admin/photos', { method: 'DELETE' });
              const data = await res.json();
              if (data.ok) alert(`已删除 ${data.data?.deleted || 0} 张照片`);
              else alert('删除失败');
            }}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded text-sm text-red-300/80 transition-colors"
          >
            清空所有照片
          </button>
        </section>

        {/* User list */}
        <section>
          <h3 className="text-white/60 text-sm mb-3">用户列表 ({users.length})</h3>
          <div className="space-y-1">
            {users.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-white/5">
                <div>
                  <span className="text-white/70 text-sm">{u.name}</span>
                  <span className="text-white/20 text-xs ml-2">{u.role === 'operator' ? '管理员' : ''}</span>
                  <span className="text-white/20 text-xs ml-2">{u.photo_count || 0} 张照片</span>
                </div>
                {u.role !== 'operator' && (
                  <button
                    onClick={() => deleteUser(u.id, u.name)}
                    className="text-red-400/50 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
