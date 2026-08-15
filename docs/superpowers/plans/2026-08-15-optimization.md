# 秋日公园 · 全面焕新与优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按规格 `docs/superpowers/specs/2026-08-15-optimization-design.md` 完成方向 A 视觉焕新与性能/SEO/可访问性/代码质量/部署全维度优化，并通过构建与浏览器回归验证。

**Architecture:** 六阶段推进：先做不碰视觉的后端加固（安全/事务/缓存），再做性能内核（粒子/模糊/动画库），然后视觉焕新（设计令牌/报头/画框照片/便签留言墙），接着新增留言点赞与热度标题功能，最后 SEO/可访问性收口与全量验证。每阶段独立可提交、可验证。

**Tech Stack:** Next.js 16.2.6 (App Router, Turbopack) · React 19.2 · TypeScript · Tailwind 4 · libsql · sharp · GSAP（移除 framer-motion）· vitest（新增测试基建）· agent-browser（浏览器回归）。

**关键约束（务必遵守）：**
- 本仓库 `AGENTS.md` 要求：改动 Next.js 用法前先读 `node_modules/next/dist/docs/` 对应文档；Next 16 中 `params`/`cookies()` 为异步 API（项目已遵循）。
- 提交粒度：每个 Task 完成后单独 commit，消息格式见各 Task 末尾。
- 全程使用工作区根 `C:\Users\28389\Desktop\deepseek\autumn-park`，命令在 PowerShell 下执行。
- 验证命令基线：`npm run lint`（0 error 目标）、`npm run build`（Turbopack）、`npx vitest run`。

---

## Phase 0 · 测试基建与基线

### Task 0.1: 引入 vitest 测试基建

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Create: `tests/README.md`（说明测试范围与运行方式）

- [ ] **Step 1: 安装 vitest**

Run: `npm i -D vitest`
Expected: 安装成功，`package.json` devDependencies 出现 `"vitest"`。

- [ ] **Step 2: 添加 test script**

`package.json` scripts 增加：

```json
"test": "vitest run"
```

- [ ] **Step 3: 创建 vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
});
```

- [ ] **Step 4: 冒烟验证**

Run: `npm test -- tests/README.md`（预期报"没有测试文件"；再创建 Task 0.2 的任一测试后运行 `npm test`）。
Expected: `vitest run` 正常执行并输出测试结果（0 个测试时 exit 1 属正常，提示 No test files found）。

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json tests/README.md
git commit -m "test: 引入 vitest 测试基建"
```

### Task 0.2: 为纯逻辑模块编写测试（含两处可测性小重构）

**Files:**
- Modify: `lib/time.ts`（getTimeOfDay/getTimeProgress 接受可选 date/hour 参数）
- Modify: `lib/weather.ts`（导出 countWinner）
- Create: `tests/seasons.test.ts` `tests/time.test.ts` `tests/cache.test.ts` `tests/rate-limit.test.ts` `tests/playlist.test.ts` `tests/weather-count.test.ts`

- [ ] **Step 1: time.ts 可测性重构**

把 `lib/time.ts` 改为：

```ts
// lib/time.ts — Time-of-day utilities for day/night cycle
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'evening';
  return 'night';
}

export function getTimeProgress(tod: TimeOfDay, hours?: number): number {
  const d = hours === undefined ? new Date() : null;
  const h = hours === undefined ? (d as Date).getHours() + (d as Date).getMinutes() / 60 : hours;
  switch (tod) {
    case 'morning': return (h - 5) / 5;
    case 'day': return (h - 10) / 7;
    case 'evening': return (h - 17) / 3;
    case 'night': {
      if (h >= 20) return (h - 20) / 9;
      return (h + 4) / 9;
    }
  }
}

export const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: '清晨', day: '白昼', evening: '黄昏', night: '夜晚',
};
```

- [ ] **Step 2: weather.ts 导出 countWinner**

`lib/weather.ts` 第 25 行改为：

```ts
export function countWinner(votes: { vote: string; cnt: number }[], fallback: Weather): Weather {
  if (votes.length === 0) return fallback;
  const maxCnt = votes[0].cnt;
  const topVotes = votes.filter(v => v.cnt === maxCnt).map(v => v.vote as Weather);
  return WEATHER_PRIORITY.find(w => topVotes.includes(w)) || fallback;
}
```

（同步修改第 28 行内部使用处为 `votes.filter((v) => v.cnt === maxCnt).map((v) => v.vote as Weather)`，消除 `any`。）

- [ ] **Step 3: 编写 tests/seasons.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { getSeasonState } from '@/lib/seasons';

function state(dateStr: string) {
  // 用本地时区构造正午时间，避免时区导致 doy 偏移
  const [y, m, d] = dateStr.split('-').map(Number);
  return getSeasonState(new Date(y, m - 1, d, 12, 0, 0));
}

describe('getSeasonState', () => {
  it('基本季节判断', () => {
    expect(state('2026-03-15').season).toBe('spring');
    expect(state('2026-07-15').season).toBe('summer');
    expect(state('2026-10-15').season).toBe('autumn');
    expect(state('2026-12-15').season).toBe('winter');
    expect(state('2026-01-15').season).toBe('winter');
  });
  it('边界日期', () => {
    expect(state('2026-03-01').season).toBe('spring');
    expect(state('2026-02-28').season).toBe('winter');
    expect(state('2026-06-01').season).toBe('summer');
    expect(state('2026-09-01').season).toBe('autumn');
    expect(state('2026-12-01').season).toBe('winter');
  });
  it('过渡窗口产生 secondarySeason', () => {
    const s = state('2026-02-25'); // 距 3/1 边界 4 天，mid 为边界日
    expect(s.season).toBe('winter');
    expect(s.secondarySeason).toBe('spring');
    expect(s.transitionWeight).toBeCloseTo(3 / 7, 5);
  });
  it('非过渡期无 secondary', () => {
    expect(state('2026-05-15').secondarySeason).toBeNull();
    expect(state('2026-05-15').transitionWeight).toBe(0);
  });
  it('闰年 2 月底', () => {
    expect(state('2024-02-29').season).toBe('winter');
    expect(state('2024-03-01').season).toBe('spring');
  });
  it('跨年过渡（12 月底 → 次年春季）', () => {
    const s = state('2026-12-29');
    expect(s.season).toBe('winter');
    expect(s.secondarySeason).toBe('spring');
    expect(s.transitionWeight).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: 编写 tests/time.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { getTimeOfDay, getTimeProgress } from '@/lib/time';

describe('getTimeOfDay', () => {
  it('时段边界', () => {
    const at = (h: number) => new Date(2026, 0, 1, h, 0, 0);
    expect(getTimeOfDay(at(5))).toBe('morning');
    expect(getTimeOfDay(at(9))).toBe('morning');
    expect(getTimeOfDay(at(10))).toBe('day');
    expect(getTimeOfDay(at(16))).toBe('day');
    expect(getTimeOfDay(at(17))).toBe('evening');
    expect(getTimeOfDay(at(19))).toBe('evening');
    expect(getTimeOfDay(at(20))).toBe('night');
    expect(getTimeOfDay(at(3))).toBe('night');
  });
});

describe('getTimeProgress', () => {
  it('夜间跨零点进度连续', () => {
    expect(getTimeProgress('night', 23)).toBeCloseTo(3 / 9, 5);
    expect(getTimeProgress('night', 2)).toBeCloseTo(6 / 9, 5);
  });
  it('白天线性', () => {
    expect(getTimeProgress('day', 10)).toBe(0);
    expect(getTimeProgress('day', 17)).toBe(1);
  });
});
```

- [ ] **Step 5: 编写 tests/cache.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { LRUCache, apiCacheGet, apiCacheSet, apiCacheClear } from '@/lib/cache';

describe('LRUCache', () => {
  it('容量驱逐最久未用', () => {
    const c = new LRUCache<string>(10);
    c.set('a', 'A', 4); c.set('b', 'B', 4); c.set('c', 'C', 4); // 12 > 10，驱逐 a
    expect(c.get('a')).toBeUndefined();
    expect(c.get('b')).toBe('B');
  });
  it('get 会刷新热度', () => {
    const c = new LRUCache<string>(10);
    c.set('a', 'A', 4); c.set('b', 'B', 4);
    c.get('a');
    c.set('c', 'C', 4); // 驱逐 b 而非 a
    expect(c.get('a')).toBe('A');
    expect(c.get('b')).toBeUndefined();
  });
  it('超容单条不缓存', () => {
    const c = new LRUCache<string>(5);
    c.set('x', 'X', 100);
    expect(c.has('x')).toBe(false);
  });
});

describe('apiCache TTL', () => {
  it('过期后返回 undefined', async () => {
    apiCacheClear('');
    apiCacheSet('k', 42, 30);
    expect(apiCacheGet('k')).toBe(42);
    await new Promise(r => setTimeout(r, 50));
    expect(apiCacheGet('k')).toBeUndefined();
  });
  it('prefix 清理', () => {
    apiCacheSet('a:1', 1, 60_000); apiCacheSet('b:1', 2, 60_000);
    apiCacheClear('a:');
    expect(apiCacheGet('a:1')).toBeUndefined();
    expect(apiCacheGet('b:1')).toBe(2);
  });
});
```

- [ ] **Step 6: 编写 tests/rate-limit.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('窗口内限流', () => {
    const key = `t-${Math.random()}`;
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(false);
  });
  it('窗口过后恢复', async () => {
    const key = `t-${Math.random()}`;
    rateLimit(key, 1, 30);
    await new Promise(r => setTimeout(r, 50));
    expect(rateLimit(key, 1, 30)).toBe(true);
  });
  it('不同 key 独立', () => {
    expect(rateLimit(`t-${Math.random()}`, 1, 60_000)).toBe(true);
    expect(rateLimit(`t-${Math.random()}`, 1, 60_000)).toBe(true);
  });
});
```

- [ ] **Step 7: 编写 tests/playlist.test.ts 与 tests/weather-count.test.ts**

```ts
// tests/playlist.test.ts
import { describe, it, expect } from 'vitest';
import { trackName, DEFAULT_PLAYLIST, SCENE_PLAYLIST } from '@/lib/playlist';

describe('playlist', () => {
  it('已知曲目显示名', () => {
    expect(trackName('/music/autumn-bench/canon.mp3')).toBe('Canon in D');
  });
  it('未知曲目回退文件名', () => {
    expect(trackName('/music/x/unknown-song.mp3')).toBe('unknown-song');
  });
  it('默认歌单覆盖全部场景曲目', () => {
    const all = Object.values(SCENE_PLAYLIST).flat().filter(Boolean) as string[];
    for (const url of all) expect(DEFAULT_PLAYLIST).toContain(url);
  });
});
```

```ts
// tests/weather-count.test.ts
import { describe, it, expect } from 'vitest';
import { countWinner } from '@/lib/weather';

describe('countWinner', () => {
  it('无票回退', () => {
    expect(countWinner([], 'sunny')).toBe('sunny');
  });
  it('最高票获胜', () => {
    expect(countWinner([
      { vote: 'sunny', cnt: 3 }, { vote: 'cloudy', cnt: 5 },
    ], 'sunny')).toBe('cloudy');
  });
  it('平票按优先级（sunny > cloudy > light-rain > fog > heavy-rain > snow）', () => {
    expect(countWinner([
      { vote: 'heavy-rain', cnt: 2 }, { vote: 'fog', cnt: 2 },
    ], 'sunny')).toBe('fog');
  });
});
```

- [ ] **Step 8: 运行全部测试**

Run: `npm test`
Expected: 全部 PASS（约 6 个文件、18+ 用例）。

- [ ] **Step 9: Commit**

```bash
git add lib/time.ts lib/weather.ts tests/
git commit -m "test: 纯逻辑模块单元测试（seasons/time/cache/rate-limit/playlist/weather）"
```

### Task 0.3: 基线存档（已在探索阶段完成，此处归档记录）

- [ ] **Step 1: 确认基线数据文件存在**

Run: `Test-Path C:\Users\28389\Desktop\deepseek\autumn-park-analysis.md`
Expected: `True`。该文件含：构建/lint 基线、dev/prod Vitals、axe 审计结果、首屏 JS 948KB、音乐 34MB、45 条问题清单。

- [ ] **Step 2: 截图存档**

Run:
```powershell
Copy-Item C:\Users\28389\Desktop\deepseek\qa-shots\baseline-desktop.png, C:\Users\28389\Desktop\deepseek\qa-shots\baseline-mobile.png -Destination C:\Users\28389\Desktop\deepseek\autumn-park\docs\superpowers\plans\assets\ -Force
```
Expected: 2 个文件复制成功（若无 baseline-mobile.png 先执行 Phase 6 的截图命令重拍一张）。

（本任务无 commit，纯存档。）

---

## Phase 1 · 安全与后端加固（不碰视觉）

### Task 1.1: 照片路由访问控制漏洞 + 缓存头 + ETag 修复（高危）

**背景：** 现状 `app/api/photos/[id]/route.ts` 的 GET 在 **canView 校验之前**就从内存缓存返回图片 → 私有照片一旦被本人/管理员访问过缓存，任何持有 photoId 的人都能绕过鉴权拿到原图。同时私有照片返回 `Cache-Control: public`，共享 CDN 会缓存泄露。本任务一并修复 ETag（改为内容哈希）与缓存值结构。

**Files:**
- Modify: `app/api/photos/[id]/route.ts`（重写 GET 与缓存相关逻辑；PATCH/DELETE 小幅修改）
- Modify: `lib/cache.ts`（缓存值改为 `{ buf, etag }` 结构，保持 LRU 通用性不变）

- [ ] **Step 1: 重写 photos/[id]/route.ts 的 GET**

将整个文件替换为以下内容（PATCH/DELETE 保留原逻辑并同步 UPLOAD_DIR 注释修复与异步 unlink）：

```ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbGet, dbRun } from '@/lib/db';
import { requireSession, getSession } from '@/lib/auth';
import { apiCacheClear, fullImageCache, thumbCache } from '@/lib/cache';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { deleteImageKeys, readImageBytes } from '@/lib/storage';

const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR || './uploads');

type CachedImage = { buf: Buffer; etag: string; contentType: string };

function toBuf(data: unknown): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.from(data);
  if (data && typeof data === 'object' && 'bytes' in data) return Buffer.from(data.bytes as ArrayBuffer);
  if (typeof data === 'string') return Buffer.from(data, 'base64');
  return Buffer.from(data as ArrayBuffer);
}

function contentEtag(buf: Buffer): string {
  return '"' + crypto.createHash('sha256').update(buf).digest('hex').slice(0, 24) + '"';
}

async function canView(photo: { is_public: number | boolean; user_id: string }): Promise<boolean> {
  if (photo.is_public) return true;
  const session = await getSession();
  return Boolean(session && (session.userId === photo.user_id || session.role === 'operator'));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureTables();
    const { id } = await params;
    const session = await requireSession();
    const photo = await dbGet('SELECT * FROM photos WHERE id = ?', [id]);
    if (!photo) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
    if (photo.user_id !== session.userId && session.role !== 'operator') return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const { caption, isPublic } = await req.json();
    if (caption !== undefined) {
      const trimmed = typeof caption === 'string' ? caption.trim().slice(0, 100) : '';
      await dbRun('UPDATE photos SET caption = ? WHERE id = ?', [trimmed, id]);
    }
    if (isPublic !== undefined) await dbRun('UPDATE photos SET is_public = ? WHERE id = ?', [isPublic ? 1 : 0, id]);
    apiCacheClear('photos:public');
    fullImageCache.delete(`${id}:full`);
    fullImageCache.delete(`${id}:medium`);
    thumbCache.delete(`${id}:thumb`);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureTables();
    const { id } = await params;
    const session = await requireSession();
    const photo = await dbGet('SELECT * FROM photos WHERE id = ?', [id]);
    if (!photo) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
    if (photo.user_id !== session.userId && session.role !== 'operator') return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    await deleteImageKeys([photo.full_key, photo.thumb_key]);
    const legacyFile = path.join(UPLOAD_DIR, path.basename(photo.filename || ''));
    try { await fs.promises.unlink(legacyFile); } catch { /* 不存在则忽略 */ }
    await dbRun('DELETE FROM photos WHERE id = ?', [id]);
    await dbRun('DELETE FROM photo_comments WHERE photo_id = ?', [id]);
    apiCacheClear('photos:public');
    apiCacheClear('stats');
    fullImageCache.delete(`${id}:full`);
    fullImageCache.delete(`${id}:medium`);
    thumbCache.delete(`${id}:thumb`);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    return NextResponse.json({ ok: false, error: 'Delete failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureTables();
  const { id } = await params;
  const url = new URL(req.url);
  const isFile = url.searchParams.get('file') === '1';
  const isThumb = url.searchParams.get('thumb') === '1';
  const isMedium = url.searchParams.get('medium') === '1';
  const cacheKey = `${id}:${isThumb ? 'thumb' : isMedium ? 'medium' : 'full'}`;

  if (isFile || isThumb || isMedium) {
    // 1) 先查元数据并鉴权——内存缓存命中也必须先通过 canView（修复访问控制漏洞）
    const photo = isThumb
      ? await dbGet('SELECT id, thumb_key, thumb_data, is_public, user_id FROM photos WHERE id = ?', [id])
      : await dbGet('SELECT id, filename, data, full_key, is_public, user_id FROM photos WHERE id = ?', [id]);
    if (!photo) return new NextResponse('Not found', { status: 404 });
    if (!(await canView(photo))) return new NextResponse('Not found', { status: 404 });

    const cache = isThumb ? thumbCache : fullImageCache;
    const cached = cache.get(cacheKey) as CachedImage | undefined;
    if (cached) {
      if (req.headers.get('if-none-match') === cached.etag) return new NextResponse(null, { status: 304 });
      const isPublic = Boolean(photo.is_public);
      return new NextResponse(cached.buf as unknown as BodyInit, {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': isPublic
            ? (isThumb ? 'public, max-age=31536000, immutable' : 'public, max-age=86400')
            : 'private, max-age=86400',
          ETag: cached.etag,
        },
      });
    }

    let buf: Buffer | null = null;
    let contentType = 'image/jpeg';

    if (isThumb) {
      if (photo.thumb_key) {
        const stored = await readImageBytes(photo.thumb_key);
        if (stored) { buf = stored.bytes; contentType = stored.contentType; }
      }
      if (!buf && photo.thumb_data) buf = toBuf(photo.thumb_data);
    } else {
      if (photo.full_key) {
        const stored = await readImageBytes(photo.full_key);
        if (stored) { buf = stored.bytes; contentType = stored.contentType; }
      }
      if (!buf && photo.data) buf = toBuf(photo.data);
      if (!buf) {
        const fp = path.join(UPLOAD_DIR, path.basename(photo.filename || ''));
        try { buf = await fs.promises.readFile(fp); } catch { buf = null; }
        if (buf) contentType = String(photo.filename || '').endsWith('.png') ? 'image/png' : String(photo.filename || '').endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      }
      if (buf && isMedium && buf.length > 200 * 1024) {
        try {
          const resized = await sharp(buf).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, progressive: true }).toBuffer();
          buf = Buffer.from(resized.buffer); contentType = 'image/jpeg';
        } catch { /* 保留原图 */ }
      }
    }

    if (!buf) return new NextResponse('File missing', { status: 404 });
    const etag = contentEtag(buf);
    if (req.headers.get('if-none-match') === etag) return new NextResponse(null, { status: 304 });

    const entry: CachedImage = { buf, etag, contentType };
    if (buf.length < 50 * 1024 * 1024) cache.set(cacheKey, entry, buf.length);

    const isPublic = Boolean(photo.is_public);
    return new NextResponse(buf as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': isPublic
          ? (isThumb ? 'public, max-age=31536000, immutable' : 'public, max-age=86400')
          : 'private, max-age=86400',
        ETag: etag,
      },
    });
  }

  // JSON metadata
  const photo = await dbGet(
    `SELECT photos.id, photos.user_id, photos.filename, photos.caption, photos.is_public,
            photos.created_at, users.name as author_name
     FROM photos JOIN users ON photos.user_id = users.id WHERE photos.id = ?`,
    [id],
  );
  if (!photo) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
  if (!(await canView(photo))) return NextResponse.json({ ok: false, error: 'Photo not found' }, { status: 404 });
  return NextResponse.json({ ok: true, data: photo });
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无新增类型错误（`NextResponse` 接受 Buffer 的方式如报错，改为 `new NextResponse(new Uint8Array(buf))` 并重跑）。

- [ ] **Step 3: 浏览器验证私有照片防护**

启动生产服务器后，用 agent-browser 验证：未登录访问 `/api/photos/<id>?thumb=1`（私有照片）返回 404；所有者登录后 200 且 `Cache-Control` 含 `private`。

Run: `npm run build && npm start`（PORT=3001），再执行 Phase 6 回归脚本中对应断言。
Expected: 未登录 404；登录后 200 + `Cache-Control: private, max-age=86400`。

- [ ] **Step 4: Commit**

```bash
git add app/api/photos/[id]/route.ts
git commit -m "fix: 照片路由访问控制（缓存前鉴权）+ 私有照片 Cache-Control + 内容哈希 ETag"
```

### Task 1.2: 目录穿越修复 + 异步 IO（admin/photos DELETE）

**Files:**
- Modify: `app/api/admin/photos/route.ts`

- [ ] **Step 1: 修复 DELETE 两处路径拼接与同步 IO**

将 `app/api/admin/photos/route.ts` 的 DELETE 中两处循环改为（第一处 brokenOnly 分支、第二处全删分支同构）：

```ts
    // 安全拼接：只接受纯文件名，杜绝 ../ 越界
    const safeLegacyPath = (filename: unknown): string | null => {
      if (typeof filename !== 'string' || !filename) return null;
      const base = path.basename(filename);
      if (base !== filename || base.startsWith('.')) return null;
      return path.join(UPLOAD_DIR, base);
    };
    for (const p of photos) {
      await deleteImageKeys([p.full_key, p.thumb_key]);
      const fp = safeLegacyPath(p.filename);
      if (fp) { try { await fs.promises.unlink(fp); } catch { /* 忽略不存在 */ } }
    }
```

同时顶部 `const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');` 改为：

```ts
const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR || './uploads');
```

- [ ] **Step 2: 验证**

Run: `npm run lint` 与 `npx tsc --noEmit`
Expected: 通过；无 `unlinkSync` 残留（grep `unlinkSync` 应只剩 0 处）。

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/photos/route.ts
git commit -m "fix: admin 删除路径 basename 白名单化 + 异步 unlink"
```

### Task 1.3: admin/users 删除事务化 + 级联清理 + 越界修复

**Files:**
- Modify: `app/api/admin/users/route.ts`
- Modify: `lib/db.ts`（新增 `dbBatch` 辅助，基于 libsql `batch`，语句组在同一事务中执行）

- [ ] **Step 1: lib/db.ts 增加 dbBatch**

在 `dbRun` 之后追加：

```ts
// 事务性批量执行（libsql HTTP batch 在服务端同一事务内执行，失败整体回滚）
export async function dbBatch(statements: { sql: string; args?: any[] }[]): Promise<void> {
  const db = getDb();
  await db.batch(statements.map(s => ({ sql: s.sql, args: s.args ?? [] })), 'write');
}
```

- [ ] **Step 2: 重写 admin/users DELETE**

`app/api/admin/users/route.ts` 的 DELETE 替换为：

```ts
export async function DELETE(req: NextRequest) {
  try {
    await ensureTables();
    await requireOperator();
    const { userId } = await req.json();
    if (!userId || typeof userId !== 'string') return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });

    const photos = await dbAll('SELECT id, filename, full_key, thumb_key FROM photos WHERE user_id = ?', [userId]);
    const safeLegacyPath = (filename: unknown): string | null => {
      if (typeof filename !== 'string' || !filename) return null;
      const base = path.basename(filename);
      if (base !== filename || base.startsWith('.')) return null;
      return path.join(UPLOAD_DIR, base);
    };

    // 1) 先删存储对象与遗留文件（失败不阻断；DB 记录由事务删除）
    for (const p of photos) {
      await deleteImageKeys([p.full_key, p.thumb_key]);
      const fp = safeLegacyPath(p.filename);
      if (fp) { try { await fs.promises.unlink(fp); } catch { /* 忽略 */ } }
    }

    // 2) 单事务删除全部关联数据（含他人对 TA 照片的评论）
    await dbBatch([
      { sql: 'DELETE FROM photo_comments WHERE photo_id IN (SELECT id FROM photos WHERE user_id = ?)', args: [userId] },
      { sql: 'DELETE FROM photo_comments WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM photos WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM weather_votes WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM spaces WHERE user_id = ?', args: [userId] },
      { sql: 'UPDATE invite_codes SET used_by = NULL WHERE used_by = ?', args: [userId] },
      { sql: 'DELETE FROM users WHERE id = ? AND role != \'operator\'', args: [userId] },
    ]);

    apiCacheClear('photos:public');
    apiCacheClear('stats');
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}
```

顶部 `UPLOAD_DIR` 同步加 `/* turbopackIgnore: true */` 注释；`dbAll` 引入保留。

- [ ] **Step 3: 验证**

Run: `npm run lint && npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 4: Commit**

```bash
git add lib/db.ts app/api/admin/users/route.ts
git commit -m "fix: 用户删除事务化 + 他人评论级联清理 + 路径白名单"
```

### Task 1.4: admin/photos 迁移健壮性（损坏 BLOB 不再卡死）

**Files:**
- Modify: `app/api/admin/photos/route.ts`

- [ ] **Step 1: POST 迁移逻辑重写**

将 POST 中 `photos.map` 内部 catch 后的返回改为"标记损坏并置空 data"，并在成功迁移后统一失效缓存。替换整段（第 88–128 行）为：

```ts
    const errors: string[] = [];
    let ok = 0;
    let broken = 0;
    for (const p of photos) {
      try {
        const buf = toBuffer(p.data);
        const fullKey = keyFor(p.id, 'full');
        const thumbKey = keyFor(p.id, 'thumb');
        const thumb = await sharp(buf)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 65, mozjpeg: true })
          .toBuffer();
        await writeImageBytes(fullKey, Buffer.from(buf));
        await writeImageBytes(thumbKey, Buffer.from(thumb));
        await dbRun(
          'UPDATE photos SET full_key = ?, thumb_key = ?, data = NULL, thumb_data = NULL WHERE id = ?',
          [fullKey, thumbKey, p.id]
        );
        ok++;
      } catch (e: unknown) {
        // 损坏数据：清空 data 字段并记录，避免每轮都重试同一张坏图导致迁移永远完不成
        broken++;
        await dbRun('UPDATE photos SET data = NULL, thumb_data = NULL WHERE id = ?', [p.id]);
        errors.push(`${String(p.id).slice(0, 20)}: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }

    apiCacheClear('photos:public');
    apiCacheClear('stats');

    const left = Math.max(0, remaining.cnt - photos.length);
    return NextResponse.json({
      ok: true,
      data: {
        done: left <= 0,
        batch: ok,
        broken,
        remaining: left,
        errors: errors.slice(0, 3),
        message: `本批: ${ok}/${photos.length}  剩余: ${left} 张`,
      },
    });
```

- [ ] **Step 2: 验证**

Run: `npm run lint && npx tsc --noEmit`
Expected: 通过；`remaining.cnt` 在坏图存在时也会随批次递减。

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/photos/route.ts
git commit -m "fix: 迁移损坏 BLOB 置空跳过，避免死循环；迁移后失效公开缓存"
```

### Task 1.5: storage.ts 本地模式异步化

**Files:**
- Modify: `lib/storage.ts`

- [ ] **Step 1: 同步 IO 改异步（接口签名不变）**

`lib/storage.ts` 中两处替换：

```ts
  // writeImageBytes 本地分支
  const file = path.join(uploadDir(), key);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, bytes);
```

```ts
  // readImageBytes 本地分支
  const file = path.join(uploadDir(), key);
  try { return { bytes: await fs.promises.readFile(file), contentType: 'image/jpeg' }; } catch { return null; }
```

（删除 `fs.existsSync` 检查，直接用 try/catch。）

- [ ] **Step 2: 验证**

Run: `npm run lint && npx tsc --noEmit`
Expected: 通过；grep `readFileSync|writeFileSync|existsSync` 在 `lib/` 与 `app/` 下仅剩 `lib/db.ts` 的 `fs.mkdirSync`（保留，冷启动一次）与各路由内 `fs.promises`。

- [ ] **Step 3: Commit**

```bash
git add lib/storage.ts
git commit -m "perf: 本地存储读写改为异步 IO，避免阻塞事件循环"
```

### Task 1.6: TZ 配置与 Docker 镜像瘦身

**Files:**
- Modify: `Dockerfile`
- Modify: `fly.toml`
- Modify: `render.yaml`

- [ ] **Step 1: Dockerfile runner 改纯净镜像 + TZ**

`Dockerfile` 第 19 行起 runner 阶段改为：

```dockerfile
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p /app/data /app/uploads && chown -R nextjs:nodejs /app/data /app/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **Step 2: fly.toml 加 TZ 与常驻**

`fly.toml` `[env]` 段增加 `TZ = "Asia/Shanghai"`，`[http_service]` 段 `min_machines_running = 0` 改为 `1`，`[[vm]]` 增加 `swap_size_mb = 256`。

- [ ] **Step 3: render.yaml 加 TZ**

`envVars` 增加：

```yaml
      - key: TZ
        value: Asia/Shanghai
```

- [ ] **Step 3b: 存储配置启动警告（lib/storage.ts）**

`lib/storage.ts` 顶部 `useObjectStorage` 定义之后加：

```ts
if (!useObjectStorage && process.env.NODE_ENV === 'production') {
  console.warn('[storage] 未配置 S3/R2 对象存储，图片将写入本地磁盘。Render 免费套餐的磁盘为临时盘，重新部署会丢失图片，请配置 S3_* 或使用持久磁盘。');
}
```

- [ ] **Step 4: 验证**

Run: `npm run build`
Expected: 通过（Docker 构建如本地有 docker 可运行 `docker build -t autumn-park:test .` 验证镜像能构建；无 docker 则仅语法检查）。

- [ ] **Step 5: Commit**

```bash
git add Dockerfile fly.toml render.yaml
git commit -m "chore: TZ=Asia/Shanghai、Fly 常驻实例、Docker runner 镜像瘦身"
```

### Task 1.7: 类型与一致性收口（types / profile / register / comments / ensureTables）

**Files:**
- Modify: `lib/types.ts`
- Modify: `app/api/user/profile/route.ts`
- Modify: `app/api/auth/register/route.ts`
- Modify: `app/api/comments/[photoId]/route.ts`
- Modify: `lib/db.ts`（ensureTables 初始化 Promise 竞态修复）

- [ ] **Step 1: types.ts 补全字段建模**

`lib/types.ts` 的 `User` 接口扩展为：

```ts
export interface User {
  id: string;
  name: string;
  display_name?: string;
  bio?: string;
  role: UserRole;
  invite_code: string;
  created_at: string;
}
```

- [ ] **Step 2: profile 路由空值校验**

`app/api/user/profile/route.ts` PATCH 中 displayName 分支改为（空串拒绝并返回 400）：

```ts
    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0) {
        return NextResponse.json({ ok: false, error: '昵称不能为空' }, { status: 400 });
      }
      const name = displayName.trim().slice(0, 24);
      await dbRun('UPDATE users SET display_name = ? WHERE id = ?', [name, session.userId]);
    }
```

- [ ] **Step 3: register 路由 role 类型修复**

`app/api/auth/register/route.ts` 第 53–59 行改为：

```ts
    const role: UserRole = isBootstrap ? 'operator' : 'user';
    const pwdHash = hashPassword(password);
    await dbRun('INSERT INTO users (id, name, password_hash, role, invite_code) VALUES (?, ?, ?, ?, ?)', [userId, trimmedName, pwdHash, role, inviteCode.trim()]);
    await dbRun('UPDATE invite_codes SET used_by = ? WHERE code = ?', [userId, inviteCode.trim()]);
    await dbRun('INSERT OR IGNORE INTO spaces (user_id, scene, weather) VALUES (?, \'autumn-bench\', \'sunny\')', [userId]);

    const session: UserSession = { userId, name: trimmedName, role };
    await createSession({ id: userId, name: trimmedName, role });
    return NextResponse.json({ ok: true, data: session });
```

（import 增加 `import type { ApiResponse, UserSession, UserRole } from '@/lib/types';`，删除未用的 ApiResponse 若 lint 报未使用。）

- [ ] **Step 4: comments 路由权限语义与 String 比较统一**

`app/api/comments/[photoId]/route.ts`：
- GET 第 19 行、POST 第 56 行：比较改为 `String(session.userId) !== String(photo.user_id)`。
- DELETE 第 90–93 行：`dbAll` 改 `dbGet`，权限改为「评论作者本人或照片主或运营」——先查评论再查照片：

```ts
    const comment = await dbGet(
      'SELECT c.id, c.user_id, c.photo_id FROM photo_comments c WHERE c.id = ? AND c.photo_id = ?',
      [commentId, photoId]
    );
    if (!comment) return NextResponse.json({ ok: false, error: 'Comment not found' }, { status: 404 });
    const photo = await dbGet('SELECT user_id FROM photos WHERE id = ?', [photoId]);
    if (String(comment.user_id) !== String(session.userId) && String(photo?.user_id) !== String(session.userId) && session.role !== 'operator') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
```

- POST 第 44 行 `req.json()` 移入 try 内已有；对 `content` 校验已存在，保留。GET 增加 try/catch 包住 `req.json`（如适用）。

- [ ] **Step 5: ensureTables 并发首调竞态修复**

`lib/db.ts` 中 `tablesReady` 布尔改为 Promise 缓存：

```ts
let tablesPromise: Promise<void> | null = null;

export function ensureTables(): Promise<void> {
  if (!tablesPromise) {
    tablesPromise = doEnsureTables().catch(err => {
      tablesPromise = null; // 失败允许下次重试
      throw err;
    });
  }
  return tablesPromise;
}

async function doEnsureTables() { /* 原 ensureTables 函数体，去掉 tablesReady 判断 */ }
```

- [ ] **Step 6: 验证**

Run: `npm test && npm run lint && npx tsc --noEmit`
Expected: 全部通过（现有测试不受影响）。

- [ ] **Step 7: Commit**

```bash
git add lib/types.ts lib/db.ts app/api/user/profile/route.ts app/api/auth/register/route.ts app/api/comments/[photoId]/route.ts
git commit -m "refactor: 类型建模补全、昵称空值校验、评论权限语义、ensureTables 并发安全"
```

## Phase 2 · 性能内核（治"卡"）

### Task 2.1: 粒子系统合并重构（单一引擎 + 预生成渐变 + DPR + 可见性暂停）

**Files:**
- Modify: `lib/particles.ts`（新增引擎与共享绘制；扩展 Particle 类型支持雪花摆动）
- Modify: `components/park/ParticleOverlay.tsx`（改用引擎，删除内联 rAF 循环）
- Modify: `components/space/SceneFrame.tsx`（删除内联粒子实现，复用引擎）

- [ ] **Step 1: 重写 lib/particles.ts**

用以下完整内容替换：

```ts
// lib/particles.ts — 统一的粒子引擎（公园页与角落共用）
import type { Season, Weather } from './types';

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  type: 'leaf' | 'petal' | 'snowflake' | 'raindrop' | 'firefly' | 'fog';
  length?: number;   // 雨滴
  angle?: number;    // 雨滴倾角
  wobble?: number;   // 雪花摆动相位
  wobbleSpeed?: number;
  wind?: number;     // 雪花水平风
}

export const SEASON_PARTICLES: Record<Season, {
  type: Particle['type']; colors: string[]; count: number;
  minSize: number; maxSize: number; minSpeed: number; maxSpeed: number;
}> = {
  spring: { type: 'petal', colors: ['#f3d9c8', '#e8b4a0', '#d98e72', '#fff8f0'], count: 70, minSize: 3, maxSize: 8, minSpeed: 0.3, maxSpeed: 0.8 },
  summer: { type: 'firefly', colors: ['#f2d9a0', '#ecd08a', '#e0bd70'], count: 40, minSize: 2, maxSize: 4, minSpeed: 0.1, maxSpeed: 0.3 },
  autumn: { type: 'leaf', colors: ['#c98a4b', '#b0563c', '#d9a05e'], count: 18, minSize: 4, maxSize: 10, minSpeed: 0.12, maxSpeed: 0.35 },
  winter: { type: 'snowflake', colors: ['rgba(255,255,255,0.9)', 'rgba(240,244,250,0.85)', 'rgba(214,226,240,0.8)'], count: 100, minSize: 2, maxSize: 6, minSpeed: 0.1, maxSpeed: 0.4 },
};

export const WEATHER_PARTICLES: Record<Weather, {
  type: Particle['type']; colors: string[]; density: number;
  speedMult: number; sizeMult: number; replaceSeason: boolean;
} | null> = {
  'sunny': null,
  'cloudy': null,
  'light-rain': { type: 'raindrop', colors: ['rgba(200,215,235,0.7)', 'rgba(180,200,225,0.6)', 'rgba(210,225,240,0.5)'], density: 1.0, speedMult: 2.5, sizeMult: 1.0, replaceSeason: true },
  'heavy-rain': { type: 'raindrop', colors: ['rgba(180,200,225,0.8)', 'rgba(160,185,215,0.7)', 'rgba(190,210,230,0.65)'], density: 2.2, speedMult: 3.5, sizeMult: 1.3, replaceSeason: true },
  'fog': { type: 'fog', colors: ['rgba(210,215,220,0.25)', 'rgba(190,200,210,0.2)'], density: 0.3, speedMult: 0.2, sizeMult: 3.0, replaceSeason: false },
  'snow': { type: 'snowflake', colors: ['rgba(255,255,255,0.8)', 'rgba(235,242,255,0.7)'], density: 1.2, speedMult: 1.0, sizeMult: 1.1, replaceSeason: false },
};

export function createParticle(
  canvasW: number, canvasH: number,
  config: (typeof SEASON_PARTICLES)[keyof typeof SEASON_PARTICLES],
  weatherMult?: { type: Particle['type']; density: number; speedMult: number; sizeMult: number } | null
): Particle {
  const speedMult = weatherMult?.speedMult ?? 1;
  const sizeMult = weatherMult?.sizeMult ?? 1;
  const isFirefly = config.type === 'firefly';
  const isRain = weatherMult?.type === 'raindrop';

  const base: Particle = {
    x: Math.random() * canvasW,
    y: isFirefly ? canvasH * 0.3 + Math.random() * canvasH * 0.4
       : isRain ? -Math.random() * canvasH
       : Math.random() * canvasH,
    vx: (Math.random() - 0.5) * config.maxSpeed * speedMult,
    vy: config.minSpeed * speedMult + Math.random() * (config.maxSpeed - config.minSpeed) * speedMult,
    size: (config.minSize + Math.random() * (config.maxSize - config.minSize)) * sizeMult,
    opacity: isRain ? 0.4 + Math.random() * 0.4 : 0.3 + Math.random() * 0.7,
    rotation: isRain ? 0 : Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    type: weatherMult ? (weatherMult.type === 'raindrop' ? 'raindrop' : weatherMult.type) : config.type,
  };
  if (isRain) {
    base.length = 12 + Math.random() * 24;
    base.angle = 0.25 + Math.random() * 0.1;
  }
  if (base.type === 'snowflake') {
    base.wobble = Math.random() * Math.PI * 2;
    base.wobbleSpeed = 0.01 + Math.random() * 0.02;
    base.wind = (Math.random() - 0.5) * 0.4;
  }
  return base;
}

const RAIN_SPEED = { min: 8, max: 16 };

export function updateParticle(p: Particle, canvasW: number, canvasH: number): Particle {
  if (p.type === 'raindrop') {
    const angle = p.angle || 0.28;
    const speed = RAIN_SPEED.min + Math.random() * (RAIN_SPEED.max - RAIN_SPEED.min);
    p.x += Math.sin(angle) * speed;
    p.y += Math.cos(angle) * speed;
    if (p.y > canvasH + 40) { p.y = -20 - Math.random() * 40; p.x = Math.random() * (canvasW + 100) - 50; }
    if (p.x > canvasW + 50) p.x = -50;
    if (p.x < -50) p.x = canvasW + 50;
    return { ...p };
  }

  let { x, y, opacity, rotation } = p;
  const { vx, vy, rotationSpeed } = p;

  x += vx; y += vy; rotation += rotationSpeed;

  if (p.type === 'firefly') {
    opacity = 0.3 + Math.abs(Math.sin(Date.now() * 0.001 + x * 0.1)) * 0.7;
  }
  if (p.type === 'snowflake' && p.wobble !== undefined) {
    p.wobble += p.wobbleSpeed ?? 0.02;
    x += (p.wind ?? 0) + Math.sin(p.wobble) * 0.3;
  }

  if (y > canvasH + 20) { y = -20; x = Math.random() * canvasW; }
  if (x > canvasW + 20) x = -20;
  if (x < -20) x = canvasW + 20;

  return { ...p, x, y, vx, vy, opacity, rotation, rotationSpeed };
}

export function getMaxParticles(isRain: boolean, weatherDensity: number): number {
  if (isRain) return Math.floor(200 * weatherDensity);
  return 60;
}

// === 绘制（渐变预生成：雨滴渐变按颜色缓存，每帧零创建） ===

export function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  gradientCache: Map<string, CanvasGradient>
): void {
  ctx.save();
  if (p.type === 'raindrop') {
    let grad = gradientCache.get(p.color);
    if (!grad) {
      grad = ctx.createLinearGradient(0, 0, 0, -1);
      grad.addColorStop(0, p.color);
      grad.addColorStop(0.3, p.color);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      gradientCache.set(p.color, grad);
    }
    const len = p.length || 20;
    ctx.globalAlpha = p.opacity;
    ctx.translate(p.x, p.y);
    ctx.rotate((p.angle || 0.28) - Math.PI / 2);
    ctx.scale(1, len);
    ctx.strokeStyle = grad;
    ctx.lineWidth = (p.size * 0.6) / len;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 1);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.globalAlpha = p.opacity;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  switch (p.type) {
    case 'leaf':
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'petal':
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'snowflake':
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'firefly':
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.size * 3;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'fog':
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 5, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  ctx.restore();
}

// === 引擎：DPR 适配、可见性暂停、rAF 生命周期 ===

export interface ParticleEngine {
  rebuild: (build: (w: number, h: number) => Particle[]) => void;
  start: () => void;
  stop: () => void;
}

export function createParticleEngine(canvas: HTMLCanvasElement): ParticleEngine {
  const ctx = canvas.getContext('2d');
  const gradientCache = new Map<string, CanvasGradient>();
  let particles: Particle[] = [];
  let buildFn: ((w: number, h: number) => Particle[]) | null = null;
  let raf = 0;
  let running = false;
  let w = 0, h = 0;

  const stopLoop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
  const startLoop = () => { if (!raf) raf = requestAnimationFrame(tick); };

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (buildFn) particles = buildFn(w, h);
  }

  function tick() {
    raf = 0;
    if (!running || !ctx) return;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
      particles[i] = updateParticle(particles[i], w, h);
      drawParticle(ctx, particles[i], gradientCache);
    }
    startLoop();
  }

  const onVisibility = () => {
    if (document.hidden) stopLoop(); else if (running) startLoop();
  };

  return {
    rebuild(build) {
      buildFn = build;
      gradientCache.clear();
      resize();
    },
    start() {
      running = true;
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', onVisibility);
      startLoop();
    },
    stop() {
      running = false;
      stopLoop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
```

- [ ] **Step 2: 重写 ParticleOverlay.tsx**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import {
  SEASON_PARTICLES, WEATHER_PARTICLES, createParticle,
  getMaxParticles, createParticleEngine,
} from '@/lib/particles';
import type { SeasonState, Weather } from '@/lib/types';
import type { Particle } from '@/lib/particles';

interface ParticleOverlayProps { seasonState: SeasonState; weather: Weather; }

export default function ParticleOverlay({ seasonState, weather }: ParticleOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createParticleEngine(canvas);
    const weatherConfig = WEATHER_PARTICLES[weather];
    const isRain = weatherConfig?.type === 'raindrop';
    const replaceSeason = weatherConfig?.replaceSeason ?? false;
    const config = SEASON_PARTICLES[seasonState.season];
    const maxParticles = getMaxParticles(isRain, weatherConfig?.density ?? 1);

    const build = (w: number, h: number): Particle[] => {
      if (isRain) {
        const count = Math.floor(120 * (weatherConfig!.density));
        return Array.from({ length: Math.min(count, maxParticles) }, () =>
          createParticle(w, h, config, {
            type: 'raindrop', density: weatherConfig!.density,
            speedMult: weatherConfig!.speedMult, sizeMult: weatherConfig!.sizeMult,
          }));
      }
      if (replaceSeason && weatherConfig) {
        const count = Math.floor(config.count * weatherConfig.density);
        return Array.from({ length: Math.min(count, maxParticles) }, () =>
          createParticle(w, h, config, weatherConfig));
      }
      const base = Array.from({ length: Math.floor(config.count * (weatherConfig?.density ?? 1)) }, () =>
        createParticle(w, h, config, weatherConfig));
      if (seasonState.secondarySeason && seasonState.transitionWeight > 0) {
        const secConfig = SEASON_PARTICLES[seasonState.secondarySeason];
        const secCount = Math.floor(secConfig.count * seasonState.transitionWeight);
        base.push(...Array.from({ length: Math.min(secCount, 50) }, () =>
          createParticle(w, h, secConfig, null)));
      }
      return base.slice(0, maxParticles);
    };

    engine.rebuild(build);
    engine.start();
    return () => engine.stop();
  }, [seasonState.season, seasonState.secondarySeason, seasonState.transitionWeight, weather]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" />;
}
```

- [ ] **Step 3: SceneFrame 删除内联粒子实现并复用引擎**

`components/space/SceneFrame.tsx`：
- 删除第 23–167 行（RainParticle/SnowParticle 接口与 createRainDrop/createSnowflake/update/draw/WeatherParticles 组件）。
- 替换为以下实现（放在 SceneFrame 定义之前）：

```tsx
// --- 角落天气粒子（复用统一引擎） ---
function WeatherParticles({ weather }: { weather: Weather }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (weather !== 'light-rain' && weather !== 'heavy-rain' && weather !== 'snow') return;

    const engine = createParticleEngine(canvas);
    const isRain = weather === 'light-rain' || weather === 'heavy-rain';
    const heavy = weather === 'heavy-rain';

    const build = (w: number, h: number): Particle[] => {
      if (isRain) {
        const count = heavy ? 200 : 100;
        return Array.from({ length: count }, () => {
          const p = createParticle(w, h, SEASON_PARTICLES.autumn, {
            type: 'raindrop', density: heavy ? 2.2 : 1.0,
            speedMult: heavy ? 3.5 : 2.5, sizeMult: heavy ? 1.3 : 1.0,
          });
          p.length = (heavy ? 15 + Math.random() * 25 : 10 + Math.random() * 18) * 0.6;
          p.opacity = heavy ? 0.4 + Math.random() * 0.35 : 0.3 + Math.random() * 0.3;
          return p;
        });
      }
      return Array.from({ length: 100 }, () => {
        const p = createParticle(w, h, SEASON_PARTICLES.winter, null);
        p.size = 1.5 + Math.random() * 3;
        p.opacity = 0.5 + Math.random() * 0.5;
        return p;
      });
    };

    engine.rebuild(build);
    engine.start();
    return () => engine.stop();
  }, [weather]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 9 }} />;
}
```

- import 更新：顶部加 `import { createParticle, createParticleEngine, SEASON_PARTICLES } from '@/lib/particles';` 与 `import type { Particle } from '@/lib/particles';`；`useEffect`/`useRef` 从 react 导入（原文件已有 useRef/useEffect import，确认保留）。同时 `SCENE_STYLES` 颜色对齐新令牌（见 Task 3.7，本步只保证编译通过）。

- [ ] **Step 4: 验证**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: 通过；grep 确认 `createLinearGradient` 只出现在 `lib/particles.ts` 的 `drawParticle` 与 `gradientCache` 逻辑中。

- [ ] **Step 5: Commit**

```bash
git add lib/particles.ts components/park/ParticleOverlay.tsx components/space/SceneFrame.tsx
git commit -m "perf: 统一粒子引擎（预生成渐变/DPR/可见性暂停），合并两套粒子实现"
```

### Task 2.2: 移除全屏 backdrop-filter（雾天卡顿主因）

**Files:**
- Modify: `components/park/ParkScene.tsx`
- Modify: `components/weather/WeatherLayer.tsx`
- Modify: `components/auth/LoginModal.tsx`
- Modify: `components/park/PublicPath.tsx`（放大弹层遮罩）
- Modify: `components/space/PhotoModal.tsx`、`components/space/PhotoWall.tsx`（按钮 backdrop-blur）
- Modify: `components/park/MessageWall.tsx`（如有 backdrop 类）

- [ ] **Step 1: 枚举全部 backdrop 用法**

Run: `grep -rn "backdrop" app components --include=*.tsx`
Expected: 得到全部清单（ParkScene、WeatherLayer、LoginModal、PublicPath、PhotoModal、PhotoWall、MessageWall 等）。

- [ ] **Step 2: ParkScene 雾层替换**

`ParkScene.tsx` 第 118–131 行雾天块中：

```tsx
          <div className="absolute inset-0" style={{
            zIndex: 3,
            background: 'linear-gradient(180deg, rgba(210,215,220,0.45) 0%, rgba(220,225,230,0.4) 50%, rgba(230,235,240,0.35) 100%)',
            backdropFilter: 'blur(4px)',
          }} />
```

改为（去掉 backdropFilter、微调透明度模拟雾感）：

```tsx
          <div className="absolute inset-0" style={{
            zIndex: 3,
            background: 'linear-gradient(180deg, rgba(214,219,224,0.62) 0%, rgba(222,227,232,0.55) 50%, rgba(232,237,242,0.5) 100%)',
          }} />
```

- [ ] **Step 3: WeatherLayer 雾层替换**

`WeatherLayer.tsx` 第 53 行 `bg-white/20 backdrop-blur-[3px]` 改为 `bg-white/25`；三个漂移雾块 `blur-3xl` 改为 `blur-2xl`（保留 2 个、删除 1 个，减少滤镜层数）：

```tsx
        <>
          <div className="absolute inset-0 bg-white/25" />
          <div className="absolute top-[10%] left-[5%] w-[45vw] h-[18vh] bg-white/25 rounded-full blur-2xl" style={{ animation: 'fogDrift 14s ease-in-out infinite' }} />
          <div className="absolute top-[45%] left-[20%] w-[50vw] h-[12vh] bg-white/15 rounded-full blur-2xl" style={{ animation: 'fogDrift 16s ease-in-out infinite' }} />
        </>
```

- [ ] **Step 4: 弹层遮罩去 blur**

- `LoginModal.tsx` 第 90 行：`bg-black/40 backdrop-blur-sm` → `bg-black/45`。
- `PublicPath.tsx` 第 134 行：`bg-[var(--bg)]/96 backdrop-blur-sm` → `bg-[var(--bg)]/97`。
- `PhotoModal.tsx` / `PhotoWall.tsx` / `MessageWall.tsx` 中 `backdrop-blur`/`backdrop-blur-sm` 类一律删除（按钮底色 `bg-white/90` 升为 `bg-white/95`）。

- [ ] **Step 5: 验证**

Run: `grep -rn "backdrop" app components --include=*.tsx`
Expected: 输出为空（0 处 backdrop-filter）。再跑 `npm run build` 确认通过。

- [ ] **Step 6: Commit**

```bash
git add components/
git commit -m "perf: 移除全部 backdrop-filter（低端机卡顿主因），雾效改用透明度渐变"
```

### Task 2.3: 移除 framer-motion（CornerTransition 改 CSS）

**Files:**
- Modify: `components/space/CornerTransition.tsx`
- Modify: `app/globals.css`（新增 corner 过渡类）
- Modify: `package.json`（移除依赖）

- [ ] **Step 1: 重写 CornerTransition.tsx**

```tsx
// components/space/CornerTransition.tsx
'use client';

import { useEffect } from 'react';

interface CornerTransitionProps {
  onEntered: () => void;
  isEntering: boolean;
  ownerName: string;
}

export default function CornerTransition({ onEntered, isEntering, ownerName }: CornerTransitionProps) {
  useEffect(() => {
    if (!isEntering) return;
    const t = setTimeout(onEntered, 1500);
    return () => clearTimeout(t);
  }, [isEntering, onEntered]);

  return (
    <div
      className={`corner-overlay fixed inset-0 z-40 flex items-center justify-center pointer-events-none ${isEntering ? 'corner-overlay--enter' : ''}`}
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-center">
        <div className={`corner-rule ${isEntering ? 'corner-rule--enter' : ''}`} />
        <p className={`corner-caption ${isEntering ? 'corner-caption--enter' : ''}`}>走进 {ownerName} 的角落</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: globals.css 追加过渡类**（追加到文件末尾，Task 3.1 会整体重组）

```css
/* Corner transition（替代 framer-motion） */
.corner-overlay { opacity: 0; transition: opacity 1.5s ease; }
.corner-overlay--enter { opacity: 1; }
.corner-rule { width: 96px; height: 2px; background: var(--hairline-strong); margin: 0 auto 16px; transform: scaleX(0); transition: transform 1s ease 0.3s; }
.corner-rule--enter { transform: scaleX(1); }
.corner-caption { opacity: 0; transform: translateY(4px); transition: opacity 1s ease 0.5s, transform 1s ease 0.5s; }
.corner-caption--enter { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .corner-overlay, .corner-rule, .corner-caption { transition-duration: 0.01s; }
}
```

- [ ] **Step 3: 卸载依赖**

Run: `npm uninstall framer-motion`
Expected: package.json / package-lock.json 移除 framer-motion；`npm run build` 通过且首屏 JS 总量下降（`.next/static/chunks` 总大小对比记录到分析文档）。

- [ ] **Step 4: 验证过渡行为**

用 agent-browser 打开 /park → 进入角落 → 观察 1.5s 内遮罩淡入、横线展开、文字出现。
Expected: 视觉过渡与原来一致；`window.getComputedStyle` 无 framer 报错（console 无错误）。

- [ ] **Step 5: Commit**

```bash
git add components/space/CornerTransition.tsx app/globals.css package.json package-lock.json
git commit -m "perf: 移除 framer-motion，角落过渡改 CSS（首屏 JS -35KB gzip）"
```

### Task 2.4: 轮询智能化（页面不可见时暂停）

**Files:**
- Modify: `components/park/MessageWall.tsx`
- Modify: `components/park/StatsBar.tsx`

- [ ] **Step 1: MessageWall 轮询改造**

`MessageWall.tsx` 第 70–74 行的 useEffect 替换为：

```tsx
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
```

- [ ] **Step 2: StatsBar 轮询改造**（同构，第 8–13 行）

```tsx
  useEffect(() => {
    const load = () => fetch('/api/stats').then(r => r.json()).then(d => { if (d.ok) setStats(d.data); }).catch(() => {});
    load();
    let t: ReturnType<typeof setInterval> | null = setInterval(load, 30000);
    const onVis = () => {
      if (document.hidden) { if (t) { clearInterval(t); t = null; } }
      else if (!t) t = setInterval(load, 30000);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => { if (t) clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, []);
```

- [ ] **Step 3: 验证**

Run: `npm run lint && npx tsc --noEmit`
Expected: 通过。浏览器验证：切到其他标签页 30s 后回来，Network 面板无轮询请求（agent-browser `network` 命令可查）。

- [ ] **Step 4: Commit**

```bash
git add components/park/MessageWall.tsx components/park/StatsBar.tsx
git commit -m "perf: 轮询在页面不可见时暂停（visibilitychange）"
```

### Task 2.5: 死资产清理与微优化

**Files:**
- Delete: `components/park/Quotes.tsx` `components/park/PhotoFragment.tsx`（已确认无引用）
- Delete: `public/assets/scene/`（10 个文件，1.2MB 死资产）
- Modify: `components/park/ParkScene.tsx`（palette 提为模块常量）

- [ ] **Step 1: 删除死代码与死资产**

```powershell
Remove-Item components/park/Quotes.tsx, components/park/PhotoFragment.tsx
Remove-Item -Recurse -Force public/assets/scene
```

- [ ] **Step 2: ParkScene palette 提为模块常量**

`ParkScene.tsx` 第 43–48 行的 `const palette = {...}` 移到组件外：

```tsx
const PALETTE: Record<string, { sky: string; ground: string; accent: string; rays: string }> = {
  spring: { sky: 'linear-gradient(180deg,#f2efe7 0%,#f7f5ef 55%,#ece8dc 100%)', ground: 'linear-gradient(0deg, rgba(120,140,110,0.14) 0%, rgba(160,170,140,0.06) 45%, transparent 100%)', accent: 'rgba(140,170,130,0.05)', rays: 'rgba(255,250,240,0.25)' },
  summer: { sky: 'linear-gradient(180deg,#eef0ea 0%,#f6f4ec 55%,#ebe5d6 100%)', ground: 'linear-gradient(0deg, rgba(130,150,110,0.14) 0%, rgba(170,175,140,0.06) 45%, transparent 100%)', accent: 'rgba(120,160,120,0.05)', rays: 'rgba(255,246,225,0.3)' },
  autumn: { sky: 'linear-gradient(180deg,#f3efe6 0%,#f7f4ec 55%,#eee7da 100%)', ground: 'linear-gradient(0deg, rgba(150,110,70,0.14) 0%, rgba(180,150,110,0.06) 45%, transparent 100%)', accent: 'rgba(181,106,76,0.05)', rays: 'rgba(255,238,210,0.28)' },
  winter: { sky: 'linear-gradient(180deg,#eef1f2 0%,#f5f5f1 55%,#e8e9e4 100%)', ground: 'linear-gradient(0deg, rgba(150,155,165,0.12) 0%, rgba(180,185,190,0.05) 45%, transparent 100%)', accent: 'rgba(150,160,180,0.04)', rays: 'rgba(245,245,250,0.2)' },
};
```

组件内改为 `const c = PALETTE[season] || PALETTE.spring;`。

- [ ] **Step 3: 验证**

Run: `npm run build && npm test`
Expected: 通过；grep `Quotes|PhotoFragment` 在 app/components 下无引用残留。

- [ ] **Step 4: Commit**

```bash
git add -A components/park/Quotes.tsx components/park/PhotoFragment.tsx public/assets/scene components/park/ParkScene.tsx
git commit -m "chore: 删除死代码与 1.2MB 死资产；ParkScene palette 提为常量"
```

### Task 2.6: 音乐 AAC 重编码（可选，非关键路径）

**Files:**
- Modify: `public/music/**`（7 首 MP3 → M4A）
- Modify: `lib/playlist.ts`（路径同步）

- [ ] **Step 1: 批量转码（源文件为 128kbps，AAC 96k 实测省 ~24%）**

```powershell
$src = "public\music"
Get-ChildItem $src -Recurse -Filter *.mp3 | ForEach-Object {
  $out = $_.FullName -replace '\.mp3$', '.m4a'
  ffmpeg -y -loglevel error -i $_.FullName -codec:a aac -b:a 96k -map_metadata 0 $out
  Remove-Item $_.FullName
}
```

- [ ] **Step 2: 播放列表路径同步**

`lib/playlist.ts` 中 7 个 `.mp3` 路径全部改为 `.m4a`（`SCENE_PLAYLIST`、`DEFAULT_PLAYLIST`、`TRACK_NAMES` 三处 key 同步）。`trackName` 回退逻辑中 `.replace('.mp3','')` 改为 `.replace(/\.(mp3|m4a)$/, '')`。

- [ ] **Step 3: 验证**

Run: `npm run build`；浏览器确认音乐播放正常（M4A 全平台兼容）。
Expected: 音乐总量由 ~34MB 降至 ~26MB；播放无报错。

- [ ] **Step 4: Commit**

```bash
git add public/music lib/playlist.ts
git commit -m "perf: 音乐转码 AAC 96k（-24% 体积，全平台兼容）"
```

### Task 2.7: React Compiler 评估（可选，评估失败即回退）

- [ ] **Step 1: 安装编译器插件**

Run: `npm i -D babel-plugin-react-compiler`
Expected: 安装成功。

- [ ] **Step 2: 开启配置**

`next.config.ts` 增加：

```ts
  reactCompiler: true,
```

- [ ] **Step 3: 构建 + 回归冒烟**

Run: `npm run build`
然后生产模式跑 Task 6.2 的基础检查（console 无错误、Hero/照片/留言正常）。
Expected: 构建通过、行为正常 → 保留；若构建失败或运行时异常 → 删除 `reactCompiler: true` 并 `npm uninstall babel-plugin-react-compiler`，回退并在分析文档记录评估结论（不阻塞后续任务）。

- [ ] **Step 4: Commit**

```bash
git add next.config.ts package.json package-lock.json
git commit -m "perf: 启用 React Compiler（自动记忆化）"
```

## Phase 3 · 视觉焕新（方向 A · 精致编辑感）

### Task 3.1: globals.css 设计令牌与组件类全量替换

**Files:**
- Modify: `app/globals.css`（整文件替换）

- [ ] **Step 1: 用以下完整内容替换 app/globals.css**

```css
@import "tailwindcss";

:root {
  --season-bg: #f6f0e4;
  --season-text: #26211a;
  --season-accent: #b0563c;
  --transition-duration: 0.6s;
  --bg: #f6f0e4;
  --bg-soft: #efe8d9;
  --surface: #fbf8f1;
  --surface-soft: #f6f0e4;
  --ink: #26211a;
  --ink-soft: #5c5343;
  --ink-weak: #8b7a63;
  --ink-ghost: #b8a98d;
  --accent: #b0563c;
  --accent-2: #c98a4b;
  --hairline: rgba(93, 72, 48, 0.14);
  --hairline-strong: rgba(93, 72, 48, 0.22);
  --shadow-card: 0 2px 10px rgba(60, 48, 30, 0.05);
  --shadow-lift: 0 8px 24px rgba(60, 48, 30, 0.10);
  --panel-w: 200px;
}

body {
  margin: 0;
  overflow: hidden;
  overflow-x: hidden;
  background: var(--season-bg);
  color: var(--season-text);
  font-family: Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Noto Serif SC', 'Songti SC', 'SimSun', serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  transition: background var(--transition-duration) ease;
}

/* --- 纸面（原 glass 体系，保留类名） --- */
.glass {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  box-shadow: var(--shadow-card);
}
.glass-strong {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  box-shadow: var(--shadow-lift);
}
.glass-btn {
  background: var(--surface);
  border: 1px solid var(--hairline-strong);
  border-radius: 999px;
  padding: 7px 16px;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--ink);
  font-weight: 500;
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
}
.glass-btn:hover { background: var(--bg-soft); border-color: rgba(93, 72, 48, 0.34); color: var(--ink); transform: translateY(-1px); }
.glass-btn:active { transform: scale(0.97); }
.glass-input {
  background: var(--surface);
  border: 1px solid var(--hairline-strong);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--ink);
  width: 100%;
  outline: none;
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.glass-input::placeholder { color: var(--ink-weak); }
.glass-input:focus { border-color: var(--accent-2); box-shadow: 0 0 0 3px rgba(176, 86, 60, 0.08); }

/* --- Buttons --- */
.btn-primary {
  background: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 999px;
  padding: 10px 22px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--surface);
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-primary:hover { opacity: 0.88; box-shadow: 0 6px 16px rgba(60, 48, 30, 0.16); }
.btn-primary:active { transform: scale(0.97); }
.btn-ghost {
  background: transparent;
  border: 1px solid var(--hairline-strong);
  border-radius: 999px;
  padding: 9px 18px;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--ink-soft);
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.btn-ghost:hover { border-color: rgba(93, 72, 48, 0.4); color: var(--ink); }

/* --- 工具类 --- */
.chip {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--ink);
  font-weight: 500;
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  box-shadow: var(--shadow-card);
}
.kicker {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 10px;
  letter-spacing: 0.42em;
  color: var(--ink-weak);
  text-transform: uppercase;
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.kicker::before { content: ''; display: inline-block; width: 30px; height: 1px; background: var(--accent); }
.hairline { border-top: 1px solid var(--hairline); }
.card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
.card-hover:hover { transform: translateY(-2px); box-shadow: var(--shadow-lift); }

/* --- 报头 masthead --- */
.masthead {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  border-bottom: 1px solid var(--hairline);
}
.masthead-title { font-size: 15px; letter-spacing: 0.24em; color: var(--ink); display: flex; align-items: baseline; gap: 12px; }
.masthead-title em { font-style: normal; font-size: 9px; letter-spacing: 0.34em; color: var(--ink-weak); }
.masthead-right { display: flex; align-items: center; gap: 14px; font-size: 11px; color: var(--ink-soft); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; }

/* --- 纸画框（照片卡） --- */
.paper-frame {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  padding: 8px 8px 12px;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.paper-frame:hover { transform: translateY(-3px); box-shadow: var(--shadow-lift); }
.paper-frame__img { aspect-ratio: 4 / 3; overflow: hidden; border-radius: 4px; background: var(--bg-soft); }
.paper-frame__img img { width: 100%; height: 100%; object-fit: cover; }
.paper-frame__label { padding: 8px 4px 0; }
.paper-frame__label .cap { font-size: 12px; line-height: 1.7; color: var(--ink); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.paper-frame__label .meta { font-size: 10px; letter-spacing: 0.06em; color: var(--ink-weak); margin-top: 4px; }

/* --- 便签留言 --- */
.note-card {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: var(--shadow-card);
  transition: transform 0.15s ease;
}
.note-card:hover { transform: rotate(0deg) translateY(-1px); }

/* --- Hero 动态标题注记 --- */
.hero-title-note { display: block; margin-top: 14px; font-size: 11px; letter-spacing: 0.2em; color: var(--ink-weak); font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif; }

/* --- Corner transition（替代 framer-motion） --- */
.corner-overlay { opacity: 0; transition: opacity 1.5s ease; }
.corner-overlay--enter { opacity: 1; }
.corner-rule { width: 96px; height: 2px; background: var(--hairline-strong); margin: 0 auto 16px; transform: scaleX(0); transition: transform 1s ease 0.3s; }
.corner-rule--enter { transform: scaleX(1); }
.corner-caption { opacity: 0; transform: translateY(4px); transition: opacity 1s ease 0.5s, transform 1s ease 0.5s; }
.corner-caption--enter { opacity: 1; transform: none; }

@keyframes leafSway { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
@keyframes slowFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* --- Blur-up image loading --- */
.img-loading { filter: blur(10px); transform: scale(1.05); transition: filter 0.4s ease, transform 0.4s ease; }
.img-loaded { filter: blur(0); transform: scale(1); }

/* --- Animations --- */
@keyframes breathe { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
.animate-breathe { animation: breathe 3s ease-in-out infinite; }
@keyframes godRays { 0%, 100% { opacity: 0.5; } 30% { opacity: 0.7; } 60% { opacity: 0.4; } 85% { opacity: 0.6; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-slideUp { animation: slideUp 0.5s ease both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.animate-fadeIn { animation: fadeIn 0.3s ease both; }
@keyframes popIn { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.polaroid-card { animation: popIn 0.5s ease both; }
@keyframes sunPulse { 0%, 100% { opacity: 0.75; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
@keyframes cloudDrift { 0%, 100% { transform: translateX(-2%); } 50% { transform: translateX(2%); } }
@keyframes fogDrift { 0%, 100% { opacity: 0.4; transform: translateX(-1%); } 50% { opacity: 0.6; transform: translateX(1%); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

/* --- 滚动条 --- */
* { scrollbar-width: thin; scrollbar-color: var(--hairline-strong) transparent; }
*::-webkit-scrollbar { width: 6px; height: 6px; }
*::-webkit-scrollbar-thumb { background: var(--hairline-strong); border-radius: 3px; }
*::-webkit-scrollbar-track { background: transparent; }
```

- [ ] **Step 2: 验证**

Run: `npm run build`
Expected: 通过。浏览器打开 /park 检查整体纸色变暖、报头类存在、无 CSS 报错。grep 确认旧色值 `#faf9f5`、`#a29c90`、`#c15f3c` 不再出现在 globals.css。

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: 方向A设计令牌全量替换（纸感/对比度AA/0.6s过渡/报头与画框工具类）"
```

### Task 3.2: 报头 masthead 重组（StatsBar / UserMenu / AmbientSound 内联化）

**Files:**
- Modify: `app/park/page.tsx`
- Modify: `components/park/StatsBar.tsx`（改内联渲染）
- Modify: `components/auth/UserMenu.tsx`（改内联渲染）
- Modify: `components/park/AmbientSound.tsx`（新增 placement 属性）

- [ ] **Step 1: StatsBar 内联化**

`StatsBar.tsx` 返回块中 `className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none max-md:hidden md:top-16"` 改为 `className="masthead-stats pointer-events-none hidden md:flex items-center" style={{ gap: 12 }}`（外层 div 与 chip 合并为一行）。完整替换 return：

```tsx
  return (
    <div className="hidden md:flex items-center" style={{ gap: 14, fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <span>👥 <b style={{ color: 'var(--ink)' }}>{stats.users}</b></span>
      <span>🖼 <b style={{ color: 'var(--ink)' }}>{stats.photos}</b></span>
      <span>💬 <b style={{ color: 'var(--ink)' }}>{stats.messages}</b></span>
      {voteTotal > 0 && (
        <span>今日投票 <b style={{ color: 'var(--ink)' }}>{voteTotal}</b></span>
      )}
    </div>
  );
```

- [ ] **Step 2: UserMenu 内联化**

`UserMenu.tsx` 外层 div 的 className 由 `"fixed top-4 z-30 flex items-center gap-2 right-4 md:right-[296px]"` 改为 `"flex items-center gap-2"`；`我的角落`按钮类 `glass-btn` 改为 `glass-btn !px-3 !py-1.5 text-[11px]`；三个 button 各加 `type="button"`；色点 span 加 `aria-hidden="true"`。

- [ ] **Step 3: AmbientSound 增加 placement**

`AmbientSound.tsx`：
- Props 增加 `placement?: 'masthead' | 'corner'`（默认 'corner'）。
- 返回的根 div className 改为：

```tsx
    <div className={placement === 'masthead'
      ? 'flex gap-2 items-center'
      : 'fixed bottom-4 left-4 md:left-[calc(var(--panel-w)+40px)] z-25 flex gap-2 items-end max-md:bottom-4 max-md:left-2'}>
```

- masthead 模式下隐藏部分文案：曲名 `<b>` 加 `hidden md:inline`；天气音效按钮文字已有 hidden md:inline。

- [ ] **Step 4: ParkPage 重组 masthead 与布局**

`app/park/page.tsx` 做以下修改：
1. 在 `</ParkCanvas>` 之后、`<WeatherLayer>` 之前插入 masthead：

```tsx
      {/* Masthead 报头 */}
      <header className="masthead">
        <div className="masthead-title">
          秋日公园 <em>AUTUMN PARK</em>
        </div>
        <div className="masthead-right">
          <StatsBar />
          {session ? (
            <UserMenu
              session={session}
              onEnterCorner={() => enterCorner(session.userId, session.name)}
              onOpenAdmin={() => setShowAdmin(true)}
              onLogout={handleLogout}
            />
          ) : (
            <button type="button" onClick={() => setShowLogin(true)} className="glass-btn !px-3 !py-1.5 text-[11px]">
              登录
            </button>
          )}
          <AmbientSound weather={weather} placement="masthead" />
        </div>
      </header>
```

2. 删除原 `<StatsBar />` 独立渲染行（原第 121 行）。
3. 删除原 UserMenu/登录按钮 fixed 块（原第 125–139 行）。
4. `<AmbientSound weather={weather} />` 原第 142 行删除（已并入 masthead）。
5. 原 hero 区 `<div className="welcome-text ..." style={{ paddingTop: 'clamp(72px, 14vh, 140px)', ... }}>` 的 paddingTop 改为 `clamp(96px, 16vh, 150px)`（给报头让位）。

- [ ] **Step 5: 验证**

Run: `npm run build && npm run lint`
Expected: 通过。浏览器检查：报头显示站点名/统计/音乐/登录；左下角不再有音乐胶囊；无控制台错误。

- [ ] **Step 6: Commit**

```bash
git add app/park/page.tsx components/park/StatsBar.tsx components/auth/UserMenu.tsx components/park/AmbientSound.tsx
git commit -m "style: 报头 masthead 重组（统计/用户菜单/音乐并入报头）"
```

### Task 3.3: Hero 重做 + HeroTitle 动态标题挂载点

**Files:**
- Create: `components/park/HeroTitle.tsx`
- Modify: `app/park/page.tsx`（hero 文案与结构）

- [ ] **Step 1: 创建 HeroTitle.tsx（Phase 4 接数据，先带回退标题）**

```tsx
// components/park/HeroTitle.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';

const DEFAULT_TITLE = '在公园里，慢慢走。';

export interface HotMessage { id: string; content: string; likes: number; }

export default function HeroTitle() {
  const [message, setMessage] = useState<HotMessage | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/messages/hot');
      const d = await r.json();
      if (d.ok) setMessage(d.data as HotMessage | null);
    } catch { /* 保持当前标题 */ }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60_000);
    const onChanged = () => refresh();
    window.addEventListener('messages-changed', onChanged);
    return () => { clearInterval(t); window.removeEventListener('messages-changed', onChanged); };
  }, [refresh]);

  return (
    <h1 className="m-0 text-[clamp(30px,5vw,52px)] leading-[1.34] font-medium tracking-wide">
      {message ? `「${message.content}」` : DEFAULT_TITLE}
      {message && (
        <span className="hero-title-note">—— 来自留言墙 · {message.likes} 人喜欢</span>
      )}
    </h1>
  );
}
```

- [ ] **Step 2: ParkPage hero 结构替换**

`app/park/page.tsx` 中 hero 区（原第 80–105 行）替换为：

```tsx
        {/* Welcome hero */}
        <div className="welcome-text pointer-events-none relative px-4 md:px-0" style={{ paddingTop: 'clamp(96px, 16vh, 150px)', paddingLeft: '4vw', zIndex: 20 }}>
          <div className="flex flex-col items-start max-w-lg">
            <div className="kicker mb-5">四季流转 · AUTUMN ISSUE</div>
            <HeroTitle />
            <p className="text-[13px] leading-[2] max-w-[300px] mb-7" style={{ color: 'var(--ink-weak)' }}>
              照片和心事，都可以留在这里。
            </p>
            <div className="flex items-center gap-3 pointer-events-auto">
              <button type="button"
                onClick={() => { if (session) enterCorner(session.userId, session.name); else setShowLogin(true); }}
                className="btn-primary"
              >
                进入公园 →
              </button>
              <button type="button"
                onClick={() => window.scrollTo({ top: window.innerHeight * 0.95, behavior: 'smooth' })}
                className="btn-ghost"
              >
                浏览相册
              </button>
            </div>
          </div>
        </div>
```

- import 增加 `import HeroTitle from '@/components/park/HeroTitle';`。
- 左侧竖排期号点缀：在 hero div 内加一个装饰块：

```tsx
        <div className="hero-issue hidden lg:block" style={{ position: 'absolute', left: 10, top: '22%', zIndex: 19, writingMode: 'vertical-rl', fontSize: 9, letterSpacing: '0.42em', color: 'var(--ink-ghost)', padding: '14px 6px', borderRight: '1px solid var(--hairline)' }}>
          NO.03 — 秋日刊 · 二〇二六
        </div>
```

（放在 hero div 内部最前。）

- [ ] **Step 3: 验证**

Run: `npm run build`
Expected: 通过。浏览器确认：默认标题「在公园里，慢慢走。」显示；kicker 带横线前缀；`/api/messages/hot` 404 时（Phase 4 前）不报错、显示默认标题。

- [ ] **Step 4: Commit**

```bash
git add components/park/HeroTitle.tsx app/park/page.tsx
git commit -m "feat: Hero 重做（报头风格 kicker/期号点缀/动态标题挂载点，回退默认标题）"
```

### Task 3.4: ParkScene 线稿精修（新令牌色 + 时段标注）

**Files:**
- Modify: `components/park/ParkScene.tsx`

- [ ] **Step 1: 线稿 SVG 颜色对齐新令牌**

`ParkScene.tsx` SVG 块中：
- `stroke="rgba(60,52,40,0.14)"` → `stroke="rgba(93,72,48,0.18)"`（地平线）
- 树干 `stroke="rgba(60,52,40,0.5)"` → `stroke="rgba(93,72,48,0.55)"`
- 叶片圆 `fill="rgba(201,138,75,0.5)"` / `fill="rgba(217,160,94,0.5)"` → `fill="rgba(176,86,60,0.55)"` / `fill="rgba(201,138,75,0.6)"`
- 地面曲线 `stroke="rgba(60,52,40,0.22)"`/`(0.2)` → `rgba(93,72,48,0.2)`

- [ ] **Step 2: 右上角时段标注**

在 SVG 之后（`parallax-slow` div 内）加：

```tsx
        <div style={{ position: 'absolute', top: '9%', right: '4%', fontSize: 10, letterSpacing: '0.3em', color: 'var(--ink-ghost)' }}>
          {SEASON_NAME[season]} · {TIME_LABELS[tod]}
        </div>
```

并在文件顶部加常量与 import：

```tsx
import { getTimeOfDay, TIME_LABELS } from '@/lib/time';
const SEASON_NAME: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
```

（`getTimeOfDay` import 已存在，扩展为 `getTimeOfDay, TIME_LABELS`。）

- [ ] **Step 3: 验证**

Run: `npm run build`
Expected: 通过。浏览器确认场景线稿颜色与右上角「秋 · 白昼/黄昏/夜晚」标注。

- [ ] **Step 4: Commit**

```bash
git add components/park/ParkScene.tsx
git commit -m "style: 线稿场景对齐新令牌，新增季节·时段标注"
```

### Task 3.5: PublicPath 画框式照片卡

**Files:**
- Modify: `components/park/PublicPath.tsx`

- [ ] **Step 1: 漫步模式卡片改为 paper-frame**

`PublicPath.tsx` 中 walk 模式照片卡（原第 93–109 行）替换为：

```tsx
              const photo = item.data;
              const date = (photo.created_at || '').slice(0, 10);
              return (
                <div key={photo.id} className="paper-frame cursor-pointer"
                  style={{ width: 'clamp(220px, 82vw, 300px)' }}
                  onClick={() => setExpanded(photo)}>
                  <div className="paper-frame__img">
                    <img src={`/api/photos/${photo.id}?thumb=1`} alt={photo.caption || `照片 by ${photo.author_name || '游客'}`}
                      className="img-loading" loading="lazy" decoding="async"
                      onLoad={e => { (e.target as HTMLImageElement).classList.replace('img-loading', 'img-loaded'); }} />
                  </div>
                  <div className="paper-frame__label">
                    {photo.caption && <p className="cap">{photo.caption}</p>}
                    <p className="meta">— {photo.author_name || '游客'}{date ? ` · ${date}` : ''}</p>
                  </div>
                </div>
              );
```

- [ ] **Step 2: 画廊模式同步样式**

gallery 模式卡片（原第 117–127 行）替换为：

```tsx
            {photos.map(photo => (
              <div key={photo.id} className="break-inside-avoid mb-4 cursor-pointer paper-frame" onClick={() => setExpanded(photo)}>
                <div className="paper-frame__img" style={{ aspectRatio: 'auto' }}>
                  <img src={`/api/photos/${photo.id}?thumb=1`} alt={photo.caption || `照片 by ${photo.author_name || '游客'}`}
                    className="w-full block img-loading" loading="lazy" decoding="async"
                    onLoad={e => { (e.target as HTMLImageElement).classList.replace('img-loading', 'img-loaded'); }} />
                </div>
                <div className="paper-frame__label">
                  {photo.caption && <p className="cap">{photo.caption}</p>}
                  <p className="meta">— {photo.author_name || '游客'}</p>
                </div>
              </div>
            ))}
```

- [ ] **Step 3: 语录卡样式更新**

quote 卡（原第 82–89 行）的 `.glass` 保留（令牌已换），文字色 `text-[var(--ink-soft)]` 保留；来源行色改 `var(--ink-weak)`。

- [ ] **Step 4: 侧栏宽度 token 化**

walk/gallery 容器 `md:max-w-[calc(100vw-320px)]` 两处改为 `md:max-w-[calc(100vw-var(--panel-w)-40px)]`。

- [ ] **Step 5: 验证**

Run: `npm run build && npm run lint`
Expected: 通过；`no-img-element` 警告保留（API 图片无法用 next/image，属可解释项）。

- [ ] **Step 6: Commit**

```bash
git add components/park/PublicPath.tsx
git commit -m "style: 照片区画框式卡片（纸标签/懒加载/描述性alt）"
```

### Task 3.6: MessageWall 便签式 + 面板宽度 token

**Files:**
- Modify: `components/park/MessageWall.tsx`

- [ ] **Step 1: 便签卡样式**

`MessageCard` 组件根 div 的 style 中 `background: 'var(--surface)'` 等保持不变，但 className 由 `"card-hover"` 改为 `"note-card"`，并加轻微随机倾斜（按消息长度取模，保持稳定）：

```tsx
    <div className="note-card" style={{
      transform: `rotate(${m.id.length % 2 === 0 ? -0.8 : 0.6}deg)`,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
```

（其余内联 style 保留。）

- [ ] **Step 2: 面板宽度 280 → var(--panel-w)**

桌面面板 div（原第 159 行 `width: 280`）改为 `width: 'var(--panel-w)'`。

- [ ] **Step 3: 验证**

Run: `npm run build`
Expected: 通过。浏览器确认右侧便签墙 200px、纸条微倾。

- [ ] **Step 4: Commit**

```bash
git add components/park/MessageWall.tsx
git commit -m "style: 留言墙便签式卡片 + 侧栏宽度 token 化"
```

### Task 3.7: 角落场景色与新令牌对齐（登录/管理随令牌自动更新）

**Files:**
- Modify: `components/space/SceneFrame.tsx`

- [ ] **Step 1: SCENE_STYLES 对齐纸感令牌**

`SceneFrame.tsx` 的 `SCENE_STYLES` 替换为：

```tsx
const SCENE_STYLES: Record<Scene, { bg: string; gradient: string }> = {
  'autumn-bench':     { bg: '#f5eee2', gradient: 'linear-gradient(180deg, #f8f2e7 0%, #f2eadd 55%, #eadfcd 100%)' },
  'darkroom':         { bg: '#efede7', gradient: 'linear-gradient(180deg, #f4f2ec 0%, #edeae2 55%, #e3e0d6 100%)' },
  'starlit-camp':     { bg: '#e9edf2', gradient: 'linear-gradient(180deg, #eff2f6 0%, #e5eaf1 55%, #d9e0ea 100%)' },
  'lighthouse-coast': { bg: '#e8eef1', gradient: 'linear-gradient(180deg, #f0f4f6 0%, #e6edf0 55%, #d9e3e8 100%)' },
  'bookstore':        { bg: '#f3ecdf', gradient: 'linear-gradient(180deg, #f8f1e4 0%, #f0e7d7 55%, #e7dcc8 100%)' },
};
```

- [ ] **Step 2: 验证**

Run: `npm run build`
Expected: 通过。登录弹窗/管理面板/角落颜色随令牌自动变化，无需额外改动（grep 确认这些组件无硬编码旧色值 `#faf9f5|#2d2a24|#2c2822|#6f685e|#57504a`，若有则替换为对应 token）。

- [ ] **Step 3: Commit**

```bash
git add components/space/SceneFrame.tsx
git commit -m "style: 角落场景渐变对齐纸感令牌"
```

### Task 3.8: 移动端布局修复与底部控件收敛

**Files:**
- Modify: `components/weather/WeatherVote.tsx`
- Modify: `components/park/MessageWall.tsx`（移动端链接位置）
- Modify: `app/park/page.tsx`（报头移动端精简）

- [ ] **Step 1: 底部控件收敛**

- `WeatherVote.tsx` 中三处 `max-md:bottom-16 max-md:left-2` 改为 `max-md:bottom-2 max-md:left-2`（音乐已移入报头，左下角让给天气）。
- `MessageWall.tsx` 移动端链接 chip（原第 155 行）style 由 `right: 8, bottom: 80` 改为 `right: 8, bottom: 8`，文字「💬 留言墙」保留。

- [ ] **Step 2: 报头移动端精简**

`app/park/page.tsx` masthead 内：`<StatsBar />` 已自带 `hidden md:flex`；`masthead-right` 中 AmbientSound 的天气音效按钮文字已是 `hidden md:inline`；把 masthead 的 padding 在移动端收紧——`masthead` 类不改，另在 ParkPage 的 header 上加 `px-4 md:px-6`（Tailwind 覆盖）：

```tsx
      <header className="masthead !px-4 md:!px-6">
```

- [ ] **Step 3: /wall 页滚动验证与修复**

浏览器（agent-browser `set device "iPhone 14"`）打开 /wall：确认列表可滚动、输入框可见。若不可滚动，`app/wall/page.tsx` 根 div 加 `style={{ overflowY: 'auto' }}`。

- [ ] **Step 4: 验证**

Run: `npm run build`
Expected: 通过。移动端截图检查：左下天气胶囊、右下留言入口、报头两段式（站名 + 登录），无重叠。

- [ ] **Step 5: Commit**

```bash
git add components/weather/WeatherVote.tsx components/park/MessageWall.tsx app/park/page.tsx app/wall/page.tsx
git commit -m "fix: 移动端底部控件收敛、报头精简、wall 页滚动兜底"
```

## Phase 4 · 留言点赞与热度标题

### Task 4.1: message_likes 迁移与类型

**Files:**
- Modify: `lib/db.ts`
- Modify: `lib/types.ts`

- [ ] **Step 1: db.ts 迁移追加**

`lib/db.ts` 的 `executeMultiple` 中 `CREATE INDEX IF NOT EXISTS idx_comments_photo` 行之后追加：

```sql
    CREATE TABLE IF NOT EXISTS message_likes (
      message_id TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (message_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_likes_message ON message_likes(message_id);
```

- [ ] **Step 2: types.ts 追加 Message 类型**

```ts
export interface Message {
  id: string;
  content: string;
  color: string;
  created_at: string;
  likes?: number;
  likedByMe?: boolean;
  canDelete?: boolean;
}
```

- [ ] **Step 3: 验证**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 4: Commit**

```bash
git add lib/db.ts lib/types.ts
git commit -m "feat: message_likes 表迁移与 Message 类型"
```

### Task 4.2: 点赞与热度 API

**Files:**
- Create: `app/api/messages/like/route.ts`
- Create: `app/api/messages/hot/route.ts`
- Modify: `app/api/messages/route.ts`（GET 附带 likes/likedByMe）

- [ ] **Step 1: 创建 app/api/messages/like/route.ts**

```ts
// app/api/messages/like/route.ts — 点赞 toggle
import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbGet, dbRun, dbAll } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { apiCacheClear } from '@/lib/cache';

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const session = await requireSession();
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message id required' }, { status: 400 });
    }
    const msg = await dbGet('SELECT id FROM messages WHERE id = ?', [id]);
    if (!msg) return NextResponse.json({ ok: false, error: 'Message not found' }, { status: 404 });

    const existing = await dbGet('SELECT 1 as x FROM message_likes WHERE message_id = ? AND user_id = ?', [id, session.userId]);
    let liked: boolean;
    if (existing) {
      await dbRun('DELETE FROM message_likes WHERE message_id = ? AND user_id = ?', [id, session.userId]);
      liked = false;
    } else {
      await dbRun('INSERT INTO message_likes (message_id, user_id) VALUES (?, ?)', [id, session.userId]);
      liked = true;
    }
    const [cnt] = await dbAll('SELECT COUNT(*) as cnt FROM message_likes WHERE message_id = ?', [id]);
    apiCacheClear('messages:');
    return NextResponse.json({ ok: true, data: { id, liked, likes: Number(cnt?.cnt ?? 0) } });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: 'Failed to like' }, { status: 500 });
  }
}
```

- [ ] **Step 2: 创建 app/api/messages/hot/route.ts**

```ts
// app/api/messages/hot/route.ts — 最热留言（Hero 标题）
import { NextResponse } from 'next/server';
import { ensureTables, dbGet } from '@/lib/db';
import { apiCacheGet, apiCacheSet } from '@/lib/cache';

const HOT_TITLE_MAX = 28;

export async function GET() {
  const cached = apiCacheGet<{ ok: true; data: { id: string; content: string; likes: number } | null }>('messages:hot');
  if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'no-cache' } });

  await ensureTables();
  const row = await dbGet(
    `SELECT m.id, m.content, COUNT(ml.user_id) as likes
     FROM messages m LEFT JOIN message_likes ml ON ml.message_id = m.id
     GROUP BY m.id
     ORDER BY likes DESC, m.created_at DESC
     LIMIT 1`
  );
  let data: { id: string; content: string; likes: number } | null = null;
  if (row && Number(row.likes) > 0) {
    const content = String(row.content);
    data = {
      id: String(row.id),
      content: content.length > HOT_TITLE_MAX ? content.slice(0, HOT_TITLE_MAX) + '…' : content,
      likes: Number(row.likes),
    };
  }
  const body = { ok: true, data } as { ok: true; data: { id: string; content: string; likes: number } | null };
  apiCacheSet('messages:hot', body, 30_000);
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-cache' } });
}
```

- [ ] **Step 3: GET /api/messages 附带 likes 与 likedByMe**

`app/api/messages/route.ts` GET 中：
- 查询改为：

```ts
  const messages = await dbAll(
    `SELECT m.id, m.content, m.color, m.created_at,
            (SELECT COUNT(*) FROM message_likes ml WHERE ml.message_id = m.id) as likes
     FROM messages m ORDER BY m.created_at DESC LIMIT 200`
  );
```

- 在 `const isOperator = ...` 后加 likedByMe 计算：

```ts
  let likedIds = new Set<string>();
  if (session) {
    const rows = await dbAll('SELECT message_id FROM message_likes WHERE user_id = ?', [session.userId]);
    likedIds = new Set(rows.map(r => String(r.message_id)));
  }
```

- `const data = ...` 改为：

```ts
  const data = messages.map(m => ({
    ...m,
    likes: Number(m.likes ?? 0),
    likedByMe: likedIds.has(String(m.id)),
    ...(isOperator ? { canDelete: true } : {}),
  }));
```

- 缓存 key 改为 `'messages:base'` 保留原逻辑（缓存原始行），`apiCacheGet`/`Set` 对应调整类型为 `Record<string, unknown>[]`。

- [ ] **Step 4: 验证**

Run: `npx tsc --noEmit && npm run build`
Expected: 通过。手动 curl：
```powershell
curl.exe -s http://localhost:3000/api/messages | Out-String
curl.exe -s http://localhost:3000/api/messages/hot | Out-String
```
Expected: messages 返回带 likes 字段；hot 返回 `{ok:true,data:null}`（暂无点赞）。

- [ ] **Step 5: Commit**

```bash
git add app/api/messages/
git commit -m "feat: 留言点赞 toggle 与最热留言 API（TTL 缓存+写失效）"
```

### Task 4.3: 留言墙点赞交互

**Files:**
- Modify: `components/park/MessageWall.tsx`
- Modify: `app/park/page.tsx`（need-login 事件监听）

- [ ] **Step 1: MessageWall 点赞逻辑**

`MessageWall.tsx`：
- interface 用 `import type { Message } from '@/lib/types';` 替换本地 Message 定义（保留 canDelete 可选字段）。
- MessageCard props 增加 `onLike: (id: string) => void`；卡片内容区底部加：

```tsx
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
```

- 组件内新增：

```tsx
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
```

- `fetchMessages` 的 `setMessages(data.data)` 保留（已含 likes/likedByMe）。
- MessageCard 调用处加 `onLike={handleLike}`（两处：page 模式与面板模式共用 MessageCard，均传入）。

- [ ] **Step 2: ParkPage 监听 need-login**

`app/park/page.tsx` 增加：

```tsx
  useEffect(() => {
    const h = () => setShowLogin(true);
    window.addEventListener('need-login', h);
    return () => window.removeEventListener('need-login', h);
  }, []);
```

- [ ] **Step 3: 验证**

Run: `npm run build`
Expected: 通过。浏览器：登录后点赞 → ♥ 变陶土红且计数 +1；未登录点赞 → 登录弹窗打开；点赞后 Hero 标题更新（Task 4.4 一并验证）。

- [ ] **Step 4: Commit**

```bash
git add components/park/MessageWall.tsx app/park/page.tsx
git commit -m "feat: 留言点赞交互（乐观更新 + 未登录唤起登录）"
```

### Task 4.4: 热度标题端到端验证

**Files:**
- 无新增（HeroTitle 已接 /api/messages/hot 与 messages-changed）

- [ ] **Step 1: 端到端验证**

生产模式（PORT=3001）下用 agent-browser：
1. 注册/登录两个账号 A、B（引导码 `park-founder-2026`）。
2. A 发留言「今天风很轻，适合散步。」→ B 点赞 ×1。
3. 刷新 /park → Hero 显示「今天风很轻，适合散步。」+ 「—— 来自留言墙 · 1 人喜欢」。
4. B 再点 ♥ 取消 → 刷新 → Hero 回退默认「在公园里，慢慢走。」。
Expected: 全部符合。

- [ ] **Step 2: Commit（如有微调）**

```bash
git add components/park/HeroTitle.tsx
git commit -m "feat: 热度标题接入验证与微调"
```

## Phase 5 · SEO / 可访问性收口

### Task 5.1: metadata / viewport / sitemap / robots / 图标

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/sitemap.ts` `app/robots.ts` `app/icon.svg` `app/apple-icon.png`

- [ ] **Step 1: layout.tsx metadata 补全**

```tsx
// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: { default: '秋日公园 — Autumn Park', template: '%s · 秋日公园' },
  description: '一座随四季流转的数字公园：照片、留言与天气都安静地留在这里。',
  openGraph: {
    title: '秋日公园 — Autumn Park',
    description: '一座随四季流转的数字公园。',
    type: 'website',
    locale: 'zh_CN',
    siteName: '秋日公园',
    ...(SITE_URL ? { url: SITE_URL } : {}),
  },
  twitter: { card: 'summary' },
  ...(SITE_URL ? { alternates: { canonical: SITE_URL } } : {}),
};

export const viewport: Viewport = {
  themeColor: '#f6f0e4',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased"><main className="contents">{children}</main></body>
    </html>
  );
}
```

- [ ] **Step 2: 创建 app/sitemap.ts**

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  return [
    { url: `${base}/park`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/wall`, changeFrequency: 'daily', priority: 0.6 },
  ];
}
```

- [ ] **Step 3: 创建 app/robots.ts**

```ts
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
```

- [ ] **Step 4: 创建 app/icon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#f6f0e4"/>
  <path d="M8 27 C8 20 10 15.5 16 15.5 C22 15.5 24 20 24 27" stroke="#8b6a4d" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M16 15.5 C16 10 18 7 23 5.5" stroke="#b0563c" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="23" cy="5.5" r="2.6" fill="#c98a4b"/>
  <path d="M4 28 C9 27 23 27 28 28" stroke="#8b6a4d" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.6"/>
</svg>
```

- [ ] **Step 5: 生成 app/apple-icon.png**

Run:
```powershell
node -e "const sharp=require('sharp'),fs=require('fs'); sharp(fs.readFileSync('app/icon.svg')).resize(180,180).png().toFile('app/apple-icon.png').then(()=>console.log('apple-icon ok'))"
```
Expected: 输出 `apple-icon ok`，`app/apple-icon.png` 生成（180×180）。

- [ ] **Step 6: 验证**

Run: `npm run build`；`curl.exe -s http://localhost:3001/sitemap.xml`、`/robots.txt`、`/icon.svg`。
Expected: build 通过；sitemap 在未设 NEXT_PUBLIC_SITE_URL 时返回空 `<urlset>`（上线配置后自动生效）；robots.txt/icon 可访问。

- [ ] **Step 7: Commit**

```bash
git add app/layout.tsx app/sitemap.ts app/robots.ts app/icon.svg app/apple-icon.png
git commit -m "feat: SEO 基建（metadata/OG/viewport/sitemap/robots/图标）"
```

### Task 5.2: 语义地标（main / header / aside / section）

**Files:**
- Modify: `app/layout.tsx`（已在 5.1 加 `<main className="contents">`）
- Modify: `components/park/PublicPath.tsx`
- Modify: `components/park/MessageWall.tsx`
- Modify: `app/park/page.tsx`（masthead 已是 `<header>`；hero 区加 section）

- [ ] **Step 1: PublicPath 根节点改 section**

`PublicPath.tsx` 返回根 `<div className="relative w-full pointer-events-none">` 改为：

```tsx
    <section aria-label="照片小径" className="relative w-full pointer-events-none">
```

（闭合标签同步改为 `</section>`。）

- [ ] **Step 2: MessageWall 面板改 aside**

桌面面板 div（`hidden md:flex` 那块）改为 `<aside aria-label="留言墙" className="reveal fixed pointer-events-auto hidden md:flex" ...>`（闭合 `</aside>`）；页模式根 div 加 `<section aria-label="留言墙">` 包裹。

- [ ] **Step 3: ParkPage hero 区加 section**

hero 外层 `<div className="welcome-text ...">` 改为 `<section aria-label="欢迎" className="welcome-text ...">`（闭合同步）。

- [ ] **Step 4: 验证**

Run: `npm run build` 后 agent-browser `a11y` 审计。
Expected: `landmark-one-main` 与 `region` 两类违规清零。

- [ ] **Step 5: Commit**

```bash
git add components/park/PublicPath.tsx components/park/MessageWall.tsx app/park/page.tsx
git commit -m "a11y: 语义地标（main/header/aside/section）"
```

### Task 5.3: 模态语义与焦点管理（共享 hook + 各弹层接入）

**Files:**
- Create: `components/ui/useModalA11y.ts`
- Modify: `components/auth/LoginModal.tsx`、`components/park/PublicPath.tsx`、`components/space/PhotoModal.tsx`
- Modify: `components/weather/WeatherVote.tsx`、`components/park/AmbientSound.tsx`（面板 aria-expanded）
- Modify: `components/space/PhotoWall.tsx`、`components/space/CornerView.tsx`（sessionUserId 透传）

- [ ] **Step 1: 创建 components/ui/useModalA11y.ts**

```ts
// components/ui/useModalA11y.ts — 对话框语义 + Escape + 焦点陷阱 + 焦点归还
'use client';

import { useEffect, useRef } from 'react';

export function useModalA11y(open: boolean, onClose: () => void, label: string) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const prev = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(
      el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(n => n.offsetParent !== null || n === document.activeElement);
    const first = focusables()[0];
    (first || el).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key === 'Tab') {
        const list = focusables();
        if (list.length === 0) return;
        const f = list[0], l = list[list.length - 1];
        if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
        else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      prev?.focus?.();
    };
  }, [open, onClose]);

  return {
    ref,
    props: { role: 'dialog', 'aria-modal': true, 'aria-label': label } as const,
  };
}
```

- [ ] **Step 2: LoginModal 接入**

```tsx
  const { ref, props } = useModalA11y(true, onClose, '进入公园（登录/注册）');
  // 根 div:
  <div ref={ref} {...props} className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center animate-fadeIn" onClick={onClose}>
```
三个输入框分别加 `aria-label="你的名字"` / `"密码"` / `"邀请码"`；`useInviteLogin` 切换按钮加 `type="button"`。

- [ ] **Step 3: PublicPath 放大弹层接入**

```tsx
  const { ref: expandedRef, props: expandedProps } = useModalA11y(Boolean(expanded), () => setExpanded(null), photoCaptionFor(expanded));
```
（用 `expanded?.caption || '照片详情'` 作为 label；hook 需在组件顶部调用——将 `useModalA11y(Boolean(expanded), () => setExpanded(null), expanded?.caption || '照片详情')` 放在组件顶部。）根 div 改 `ref={expandedRef} {...expandedProps}`；遮罩 `backdrop-blur-sm` 已在 Task 2.2 移除；关闭按钮加 `aria-label="关闭"`，下载按钮加 `aria-label="下载照片"`。

- [ ] **Step 4: PhotoModal 综合修复**

`PhotoModal.tsx`：
1. 顶部调用 `const { ref, props } = useModalA11y(true, onClose, photo?.caption || '照片详情');`（photo 可能为 undefined 时给兜底）。
2. 根 div：`ref={ref} {...props}`，遮罩 backdrop-blur 移除（Task 2.2 已做）。
3. 图标按钮加 aria-label：关闭 `aria-label="关闭"`、下载 `aria-label="下载照片"`、缩放 `aria-label="缩放"`、上一张/下一张 `aria-label="上一张"`/`"下一张"`。
4. 切换照片重置状态与防竞态：

```tsx
  const reqSeq = useRef(0);
  useEffect(() => { setZoom(1); }, [photo.id]);
  const loadComments = useCallback(async () => {
    const seq = ++reqSeq.current;
    setComments([]);
    try {
      const res = await fetch(`/api/comments/${photo.id}`);
      const d = await res.json();
      if (d.ok && seq === reqSeq.current) setComments(d.data);
    } catch {}
  }, [photo.id]);
  useEffect(() => { loadComments(); }, [loadComments]);
```

5. 评论删除权限：props 增加 `sessionUserId?: string | null`；删除按钮条件改为 `(c.user_id === sessionUserId || isOwner)`，并去掉 `opacity-0 group-hover:opacity-100`（改为始终可见），加 `aria-label="删除评论"`。
6. 图片容器加 `style={{ touchAction: 'pan-y' }}`；下载改为直接链接：

```tsx
  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = `/api/photos/${photo.id}?file=1`;
    a.download = photo.filename || 'photo.jpg';
    a.click();
  }, [photo]);
```

7. 编辑/评论输入框加 aria-label（`"编辑文案"`、`"评论内容"`）。

- [ ] **Step 5: sessionUserId 透传链**

`PhotoWall.tsx` props 增加 `sessionUserId?: string | null`；`<PhotoModal ... sessionUserId={sessionUserId} />` 透传。
`CornerView.tsx` props 增加 `sessionUserId?: string | null`；`<PhotoWall userId={userId} isOwner={isOwner} scene={space.scene} sessionUserId={sessionUserId} />`。
`app/park/page.tsx` 的 CornerView 调用处加 `sessionUserId={session?.userId ?? null}`。

- [ ] **Step 6: 面板 aria-expanded**

- `WeatherVote.tsx` 折叠按钮加 `aria-expanded={expanded}` `aria-label="天气投票"`；展开面板加 `role="region" aria-label="天气投票面板"`。
- `AmbientSound.tsx` 音乐面板触发按钮（⋯）加 `aria-expanded={showMusicPanel}` `aria-label="播放设置"`。

- [ ] **Step 7: 验证**

Run: `npm run build && npm run lint`
Expected: 通过。浏览器手测：登录弹窗打开焦点落在名字输入框、Esc 关闭；照片放大 Esc 关闭、Tab 循环困在弹窗内。

- [ ] **Step 8: Commit**

```bash
git add components/ui/useModalA11y.ts components/auth/LoginModal.tsx components/park/PublicPath.tsx components/space/PhotoModal.tsx components/space/PhotoWall.tsx components/space/CornerView.tsx app/park/page.tsx components/weather/WeatherVote.tsx components/park/AmbientSound.tsx
git commit -m "a11y: 模态 dialog 语义/焦点陷阱/Esc + PhotoModal 状态重置与竞态修复"
```

### Task 5.4: aria 补全（picker / 输入框 / alt）

**Files:**
- Modify: `components/space/ScenePicker.tsx`、`components/space/WeatherPicker.tsx`
- Modify: `components/park/MessageWall.tsx`、`components/space/PhotoWall.tsx`、`components/auth/LoginModal.tsx`（输入框 aria-label）

- [ ] **Step 1: ScenePicker / WeatherPicker aria-pressed**

`ScenePicker.tsx` button 加两个属性：

```tsx
          aria-pressed={current === s.value}
          aria-label={s.label}
```

`WeatherPicker.tsx` 同法：

```tsx
          aria-pressed={current === w.value}
          aria-label={w.label}
```

- [ ] **Step 2: 输入框 aria-label**

- `MessageWall.tsx` 留言输入框加 `aria-label="留言内容"`。
- `PhotoWall.tsx` 文案输入框加 `aria-label="照片文案"`；上传 file input 加 `aria-label="选择照片"`。
- `LoginModal.tsx` 已在 5.3 完成。

- [ ] **Step 3: 验证**

Run: `npm run build`；agent-browser `a11y`。
Expected: 无新增 violation；快照中按钮带 pressed/label 状态。

- [ ] **Step 4: Commit**

```bash
git add components/space/ScenePicker.tsx components/space/WeatherPicker.tsx components/park/MessageWall.tsx components/space/PhotoWall.tsx
git commit -m "a11y: picker aria-pressed/label 与输入框 aria-label"
```

### Task 5.5: reduced-motion 全覆盖验证

- [ ] **Step 1: 验证脚本**

agent-browser：
```powershell
agent-browser --session apark --cdp 9333 set media light reduced-motion
agent-browser --session apark --cdp 9333 open http://localhost:3001/park
agent-browser --session apark --cdp 9333 eval "getComputedStyle(document.querySelector('.masthead')).animationDuration + '|' + document.querySelectorAll('canvas').length"
```
Expected: 动画时长近似 0；粒子 canvas 存在但引擎未启动（`canvas.getContext` 调用过的 canvas 存在——以「无粒子绘制」为准：截图肉眼确认无雪花/雨丝，且页面无报错）。
恢复：`set media light no-preference`。

- [ ] **Step 2: Commit（如无改动则跳过）**

（本任务以验证为主，无代码改动时不需要 commit。）

## Phase 6 · 验证与收尾

### Task 6.1: lint / build 清零与警告收敛

**Files:**
- Modify: `lib/db.ts`（any → 泛型 DbRow）
- Modify: `lib/cache.ts`（LRUCache 泛型 + 导出 CachedImage）
- Modify: `app/api/photos/[id]/route.ts`（CachedImage 改从 lib/cache 导入）
- Modify: `components/admin/AdminPanel.tsx`（any → 具名类型）

- [ ] **Step 1: lib/db.ts 类型化**

`toObjects`/`dbAll`/`dbGet`/`dbRun` 替换为：

```ts
type DbRow = Record<string, unknown>;

function toObjects(result: { columns: string[]; rows: unknown[] }): DbRow[] {
  if (result.rows.length === 0) return [];
  if (!Array.isArray(result.rows[0])) return result.rows as DbRow[];
  return (result.rows as unknown[][]).map(row => {
    const obj: DbRow = {};
    result.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

export async function dbAll<T = DbRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = getDb();
  const result = await db.execute({ sql, args: params as never[] });
  return toObjects(result as unknown as { columns: string[]; rows: unknown[] }) as T[];
}

export async function dbGet<T = DbRow>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await dbAll<T>(sql, params);
  return rows[0];
}

export async function dbRun(sql: string, params: unknown[] = []): Promise<void> {
  const db = getDb();
  await db.execute({ sql, args: params as never[] });
}
```

- [ ] **Step 2: lib/cache.ts 导出 CachedImage**

`lib/cache.ts` 末尾追加：

```ts
// 图片内存缓存条目（buf + 内容哈希 ETag + 内容类型）
export interface CachedImage {
  buf: Buffer;
  etag: string;
  contentType: string;
}
```

`fullImageCache`/`thumbCache` 声明改为 `new LRUCache<CachedImage>(...)`。

`app/api/photos/[id]/route.ts`：删除本地 `type CachedImage = ...`，改为 `import { apiCacheClear, fullImageCache, thumbCache, type CachedImage } from '@/lib/cache';`（Task 1.1 中的本地定义以本步为准）。

- [ ] **Step 3: AdminPanel 类型化**

读取 `components/admin/AdminPanel.tsx` 后：
- 顶部定义：

```ts
interface InviteRow { code: string; used_by: string | null; created_at: string; }
interface AdminUserRow { id: string; name: string; role: string; invite_code: string; created_at: string; photo_count: number; }
```

- `useState<any[]>([])` ×2 → `useState<InviteRow[]>([])` / `useState<AdminUserRow[]>([])`；`(c: any)` → `(c: InviteRow)`；`(u: any)` → `(u: AdminUserRow)`；迁移循环 try/finally 与 state 驱动文案修复（按 Task 1.x 同构）：

```tsx
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState('');
  // 按钮 onClick:
  const runMigration = async () => {
    setMigrating(true); setMigrateMsg('');
    try {
      for (let i = 0; i < 20; i++) {
        const res = await fetch('/api/admin/photos', { method: 'POST' });
        const d = await res.json();
        setMigrateMsg(d?.data?.message || '');
        if (!d.ok || d.data?.done) break;
      }
    } finally { setMigrating(false); }
  };
```

（按钮 `disabled={migrating}`，文案 `{migrating ? '迁移中…' : '迁移旧照片'}`。）

- [ ] **Step 4: 验证**

Run: `npm run lint`
Expected: **0 error**，warning ≤ 10（剩余为 `no-img-element` 与个别 `no-explicit-any` 可解释项）。
Run: `npm test && npm run build`
Expected: 全部通过。

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts lib/cache.ts app/api/photos/[id]/route.ts components/admin/AdminPanel.tsx
git commit -m "refactor: 类型治理（db 泛型/CachedImage/AdminPanel），lint 清零"
```

### Task 6.2: 生产模式全流程回归

- [ ] **Step 1: 准备测试图片**

```powershell
node -e "const sharp=require('sharp'); sharp({create:{width:800,height:600,channels:3,background:{r:200,g:150,b:90}}}).jpeg().toFile('C:/Users/28389/Desktop/deepseek/qa-shots/test-photo.jpg').then(()=>console.log('ok'))"
```

- [ ] **Step 2: 生产启动与基础检查**

```powershell
$env:PORT="3001"; $env:BOOTSTRAP_CODE="park-founder-2026"; $env:SESSION_SECRET="regression-secret"; npm start
```
agent-browser（`--session apark --cdp 9333`，Chrome 启动方式见 Task 0.3 备注）：
1. `open http://localhost:3001/park` → `console --errors` 期望空。
2. `set viewport 1440 900` 截图 `qa-shots/after-desktop.png`；`set device "iPhone 14"` 截图 `qa-shots/after-mobile.png`；`eval` 检查 `scrollWidth <= clientWidth`（无横向溢出）。
3. Hero 默认标题文本存在：`eval "document.body.textContent.includes('在公园里，慢慢走')"` → true。

- [ ] **Step 3: 注册/登录/上传/投票/留言/点赞/热度全流程**

1. 打开登录弹窗 → 注册 tab → 填名 `回归测试`、密码 `regression123`、引导码 `park-founder-2026` → 提交 → 报头显示用户名。
2. 进入角落 → 上传 `qa-shots/test-photo.jpg`（勾选发布到公园）→ 照片网格出现新照片。
3. 回公园 → 照片小径出现照片卡。
4. 天气投票：打开面板 → 点「晴」→ 显示已投票。
5. 留言墙发消息「测试留言 A」→ 出现便签；点 ♥ → 计数 1。
6. 刷新 /park → Hero 标题变为「测试留言 A」+「—— 来自留言墙 · 1 人喜欢」。
7. 音乐：点击 ♪ 播放 → 无 console 错误、曲名显示。
8. 管理面板（引导码账号为 operator）：打开 → 无报错。
9. `/wall` 移动端可滚动、无溢出。

- [ ] **Step 4: axe 审计**

```powershell
agent-browser --session apark --cdp 9333 a11y --json
```
Expected: `violations` 为 0；`incomplete` 允许存在但需人工确认无真实问题。

- [ ] **Step 5: Commit（修复回归中发现的问题后）**

```bash
git add -A
git commit -m "fix: 全流程回归问题修复"
```

### Task 6.3: 性能对比、文档收尾与最终提交

- [ ] **Step 1: Vitals 对比**

生产模式：`agent-browser --session apark --cdp 9333 vitals http://localhost:3001/park`
与基线对比（TTFB 2.8ms / FCP 44ms / LCP 44ms / CLS 0）；同时记录 `.next/static/chunks` 总 JS 体积与基线 948KB 对比（framer-motion 移除后应下降）。
Expected: Vitals 不劣化（CLS 保持 0）；JS 总量下降。

- [ ] **Step 2: 更新分析文档**

`C:\Users\28389\Desktop\deepseek\autumn-park-analysis.md` 末尾追加「实施后对比」小节：Vitals 前后值、JS 体积、a11y 违规数（2→0）、lint 警告数（54→≤10）、完成项清单与遗留项。

- [ ] **Step 3: 截图存档**

将 `qa-shots/after-desktop.png`、`after-mobile.png` 复制到 `docs/superpowers/plans/assets/`。

- [ ] **Step 4: 最终提交**

```bash
git add docs/superpowers/plans/2026-08-15-optimization.md docs/superpowers/plans/assets/
git commit -m "docs: 实施计划完成记录与前后对比截图存档"
```

- [ ] **Step 5: 收尾检查**

- 伴同服务器（如仍在运行）：`scripts/stop-server.sh` 或直接结束对应 pwsh 后台任务。
- 后台 dev/prod 服务器与 Chrome（9333）测试进程关闭。
- `git status` 干净（`.superpowers/` 已忽略）。

<!-- PLAN-END -->



