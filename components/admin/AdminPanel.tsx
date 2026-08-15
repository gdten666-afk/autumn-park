// components/admin/AdminPanel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

interface InviteRow { code: string; used_by: string | null; created_at: string; }
interface AdminUserRow { id: string; name: string; role: string; invite_code: string; created_at: string; photo_count: number; }

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [codes, setCodes] = useState<InviteRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [count, setCount] = useState(5);
  const [generated, setGenerated] = useState<string[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/invites').then(r => r.json()).then(d => { if (d.ok) setCodes(d.data); });
    fetch('/api/admin/users').then(r => r.json()).then(d => { if (d.ok) setUsers(d.data); });
  }, []);

  const generateCodes = useCallback(async () => {
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: Math.min(100, Math.max(1, count || 1)) }),
    });
    const data = await res.json();
    if (data.ok) {
      setGenerated(data.data.codes);
      const refresh = await fetch('/api/admin/invites').then(r => r.json());
      if (refresh.ok) setCodes(refresh.data);
    }
  }, [count]);

  const runMigration = useCallback(async () => {
    setMigrating(true); setMigrateMsg('');
    try {
      let totalDone = 0;
      for (let round = 0; round < 20; round++) {
        setMigrateMsg(`迁移中... ${totalDone} 张`);
        const res = await fetch('/api/admin/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!data.ok) { setMigrateMsg('失败: ' + (data.error || '未知错误')); break; }
        totalDone += data.data?.batch || 0;
        if (data.data?.done) { setMigrateMsg(`全部完成！共迁移 ${totalDone} 张`); break; }
        if (data.data?.remaining === 0) { setMigrateMsg(`完成！${totalDone} 张`); break; }
      }
    } catch {
      setMigrateMsg('网络错误，请稍后重试');
    } finally {
      setMigrating(false);
    }
  }, []);

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
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center animate-fadeIn" onClick={onClose}>
      <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-[var(--shadow-lift)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[var(--ink)] text-lg font-serif">管理面板</h2>
          <button onClick={onClose} className="text-[var(--ink-weak)] hover:text-[var(--ink-soft)] text-sm">关闭</button>
        </div>

        {/* Invite code generation */}
        <section className="mb-6">
          <h3 className="text-[var(--ink-soft)] text-sm mb-3">生成邀请码</h3>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={count}
              min={1}
              max={100}
              onChange={e => setCount(Number(e.target.value))}
              className="w-20 px-2 py-1.5 bg-[var(--bg-soft)] border border-[var(--hairline-strong)] rounded text-[var(--ink)] text-sm text-center"
            />
            <button
              onClick={generateCodes}
              className="px-3 py-1.5 bg-[rgba(193,95,60,0.1)] hover:bg-[rgba(193,95,60,0.18)] rounded text-sm text-[var(--accent)] transition-colors"
            >
              生成
            </button>
          </div>

          {generated.length > 0 && (
            <div className="mt-3 p-3 bg-[var(--bg-soft)] rounded">
              <p className="text-[var(--ink-faint)] text-xs mb-1">新生成的邀请码：</p>
              {generated.map(code => (
                <code key={code} className="block text-[var(--accent)] text-xs font-mono">{code}</code>
              ))}
            </div>
          )}

          {codes.length > 0 && (
            <details className="mt-3">
              <summary className="text-[var(--ink-weak)] text-xs cursor-pointer hover:text-[var(--ink-soft)]">历史邀请码 ({codes.length})</summary>
              <div className="mt-2 max-h-32 overflow-y-auto">
                {codes.map(c => (
                  <div key={c.code} className="text-xs font-mono text-[var(--ink-faint)] py-0.5">
                    {c.code} {c.used_by ? '(已使用)' : '(未使用)'}
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>

        {/* Migrate legacy blob photos into storage */}
        <section className="mb-6">
          <h3 className="text-[var(--ink-soft)] text-sm mb-3">迁移旧照片到存储</h3>
          <p className="text-[var(--ink-weak)] text-[10px] mb-2">把旧版存入数据库的照片迁到对象存储/磁盘并生成缩略图，每批1张</p>
          <button
            onClick={runMigration}
            disabled={migrating}
            className="px-4 py-2 bg-[rgba(193,95,60,0.1)] hover:bg-[rgba(193,95,60,0.18)] rounded text-sm text-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {migrating ? (migrateMsg || '迁移中...') : '开始迁移'}
          </button>
          {!migrating && migrateMsg && (
            <p className="text-[var(--ink-weak)] text-[10px] mt-2">{migrateMsg}</p>
          )}
        </section>

        {/* Clean empty photo records */}
        <section className="mb-6">
          <h3 className="text-[var(--ink-soft)] text-sm mb-3">清理空照片记录</h3>
          <p className="text-[var(--ink-weak)] text-[10px] mb-2">删除既无图片数据也无存储文件的空记录</p>
          <button
            onClick={async () => {
              if (!confirm('确定要清理所有空照片记录吗？')) return;
              const res = await fetch('/api/admin/photos?broken=1', { method: 'DELETE' });
              const data = await res.json();
              if (data.ok) alert(data.data?.message || `已清理 ${data.data?.deleted || 0} 张`);
              else alert('清理失败');
            }}
            className="px-4 py-2 bg-[rgba(193,95,60,0.1)] hover:bg-[rgba(193,95,60,0.18)] rounded text-sm text-[var(--accent)] transition-colors"
          >
            清理空照片记录
          </button>
        </section>

        {/* Delete all photos */}
        <section className="mb-6">
          <h3 className="text-[var(--ink-soft)] text-sm mb-3">清空所有照片</h3>
          <button
            onClick={async () => {
              if (!confirm('确定要删除所有照片吗？此操作不可撤销！')) return;
              const res = await fetch('/api/admin/photos', { method: 'DELETE' });
              const data = await res.json();
              if (data.ok) alert(`已删除 ${data.data?.deleted || 0} 张照片`);
              else alert('删除失败');
            }}
            className="px-4 py-2 bg-[rgba(176,86,60,0.1)] hover:bg-[rgba(176,86,60,0.18)] rounded text-sm text-[#b0563c] transition-colors"
          >
            清空所有照片
          </button>
        </section>

        {/* User list */}
        <section>
          <h3 className="text-[var(--ink-soft)] text-sm mb-3">用户列表 ({users.length})</h3>
          <div className="space-y-1">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-[var(--bg-soft)]">
                <div>
                  <span className="text-[var(--ink)] text-sm">{u.name}</span>
                  <span className="text-[var(--ink-weak)] text-xs ml-2">{u.role === 'operator' ? '管理员' : ''}</span>
                  <span className="text-[var(--ink-weak)] text-xs ml-2">{u.photo_count || 0} 张照片</span>
                </div>
                {u.role !== 'operator' && (
                  <button
                    onClick={() => deleteUser(u.id, u.name)}
                    className="text-[#b0563c]/70 hover:text-[#b0563c] text-xs px-2 py-1 rounded hover:bg-[rgba(176,86,60,0.08)] transition-colors"
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
