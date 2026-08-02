# 秋日公园 UI 焕新 + 音乐播放体验 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把访客可见界面统一为「简约高级」风格（暖白底、墨色衬线标题、细线稿插画、克制动效），并重做音乐播放体验（曲目名、播放/暂停、切歌、音量、渐入渐出、柔和自动播放）。

**Architecture:** 不改数据层与 API。视觉通过 `app/globals.css` 设计令牌统一驱动，保留现有类名（glass/glass-btn 等）以减少 JSX 大面积改动；ParkScene 换配色与线稿插画；AmbientSound 重构 MusicPlayer 交互；动效用 GSAP ScrollTrigger + CSS keyframes，并尊重 `prefers-reduced-motion`。

**Tech Stack:** Next.js 16 (App Router)、Tailwind v4、GSAP + ScrollTrigger、Web Audio/HTMLAudio、React 19。

---

## 任务总览

| 任务 | 内容 | 主要文件 |
|---|---|---|
| 1 | 设计令牌与基础组件样式 | `app/globals.css` |
| 2 | ParkScene 简约插画化 | `components/park/ParkScene.tsx` |
| 3 | 首页 Hero 与顶部控件 | `app/park/page.tsx` |
| 4 | 音乐播放器重构 | `components/park/AmbientSound.tsx`、`lib/playlist.ts` |
| 5 | 照片墙简约化 | `components/park/PublicPath.tsx` |
| 6 | 留言墙简约化 | `components/park/MessageWall.tsx` |
| 7 | 天气投票与统计胶囊 | `components/weather/WeatherVote.tsx`、`components/park/StatsBar.tsx` |
| 8 | 登录注册与用户菜单 | `components/auth/LoginModal.tsx`、`components/auth/UserMenu.tsx` |
| 9 | 滚动/过渡/交互动效 | `components/park/GSAPAnimations.tsx`、各组件 hover 类 |
| 10 | 粒子调优 | `lib/particles.ts` |
| 11 | 全量验证与上线 | 全仓 |

---

### Task 1: 设计令牌与基础组件样式

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: 更新 :root 与 body 字体**

把 `:root` 块替换为：

```css
:root {
  --season-bg: #f7f6f2;
  --season-text: #2c2822;
  --season-accent: #b56a4c;
  --transition-duration: 2s;
  --bg: #f7f6f2;
  --surface: #ffffff;
  --ink: #2c2822;
  --ink-soft: #6b645a;
  --ink-faint: #8b8579;
  --ink-weak: #b3aca0;
  --accent: #b56a4c;
  --accent-2: #c98a4b;
  --hairline: rgba(60, 52, 40, 0.1);
  --hairline-strong: rgba(60, 52, 40, 0.16);
  --shadow-card: 0 6px 18px rgba(50, 40, 25, 0.05);
  --shadow-lift: 0 14px 34px rgba(50, 40, 25, 0.1);
}

body {
  margin: 0;
  overflow: hidden;
  background: var(--season-bg);
  color: var(--season-text);
  font-family: Georgia, 'Noto Serif SC', 'Songti SC', 'SimSun', serif;
  -webkit-font-smoothing: antialiased;
  transition: background var(--transition-duration) ease;
}
```

- [ ] **Step 2: 替换玻璃拟态为基础白卡样式**

把 `.glass`、`.glass-strong`、`.glass-btn`、`.glass-input` 四个块替换为：

```css
.glass {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  box-shadow: var(--shadow-card);
}
.glass-strong {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 18px;
  box-shadow: var(--shadow-lift);
}
.glass-btn {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 999px;
  padding: 7px 16px;
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
}
.glass-btn:hover {
  background: #faf9f5;
  border-color: var(--hairline-strong);
  color: var(--ink);
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}
.glass-btn:active { transform: scale(0.97); }
.glass-input {
  background: #fbfaf7;
  border: 1px solid var(--hairline-strong);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--ink-soft);
  width: 100%;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.glass-input::placeholder { color: rgba(60, 52, 40, 0.28); }
.glass-input:focus { border-color: rgba(60, 52, 40, 0.35); box-shadow: 0 0 0 3px rgba(60, 52, 40, 0.05); }
```

- [ ] **Step 3: 替换按钮样式**

把 `.btn-primary` 和 `.btn-ghost` 替换为：

```css
.btn-primary {
  background: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 999px;
  padding: 10px 22px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #f7f6f2;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-primary:hover { opacity: 0.9; box-shadow: 0 8px 20px rgba(44, 40, 34, 0.18); }
.btn-primary:active { transform: scale(0.97); }
.btn-ghost {
  background: transparent;
  border: 1px solid rgba(60, 52, 40, 0.18);
  border-radius: 999px;
  padding: 9px 18px;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.btn-ghost:hover { border-color: rgba(60, 52, 40, 0.35); color: var(--ink); }
```

- [ ] **Step 4: 追加工具类、kicker、卡片悬浮与 reduced-motion**

在 `.btn-ghost:hover` 块之后追加：

```css
/* --- Minimal utility classes --- */
.chip {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--hairline);
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  box-shadow: 0 2px 10px rgba(60, 50, 30, 0.04);
}
.kicker {
  font-size: 10px;
  letter-spacing: 0.34em;
  color: #b09a7f;
  text-transform: uppercase;
}
.hairline { border-top: 1px solid var(--hairline); }
.card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
.card-hover:hover { transform: translateY(-3px); box-shadow: var(--shadow-lift); }

@keyframes leafSway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}
@keyframes slowFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 5: 运行校验**

Run: `npm run lint`
Expected: `0 errors`（53 warnings 保持现状）

- [ ] **Step 6: 提交**

```bash
git add app/globals.css
git commit -m "style: minimal premium design tokens and base components"
```

---

### Task 2: ParkScene 简约插画化

**Files:**
- Modify: `components/park/ParkScene.tsx`

- [ ] **Step 1: 替换季节调色板**

把 `palette` 常量整体替换为：

```ts
  const palette: Record<string, { sky: string; ground: string; accent: string; rays: string }> = {
    spring: { sky: 'linear-gradient(180deg,#f2efe7 0%,#f7f5ef 55%,#ece8dc 100%)', ground: 'linear-gradient(0deg, rgba(120,140,110,0.14) 0%, rgba(160,170,140,0.06) 45%, transparent 100%)', accent: 'rgba(140,170,130,0.05)', rays: 'rgba(255,250,240,0.25)' },
    summer: { sky: 'linear-gradient(180deg,#eef0ea 0%,#f6f4ec 55%,#ebe5d6 100%)', ground: 'linear-gradient(0deg, rgba(130,150,110,0.14) 0%, rgba(170,175,140,0.06) 45%, transparent 100%)', accent: 'rgba(120,160,120,0.05)', rays: 'rgba(255,246,225,0.3)' },
    autumn: { sky: 'linear-gradient(180deg,#f3efe6 0%,#f7f4ec 55%,#eee7da 100%)', ground: 'linear-gradient(0deg, rgba(150,110,70,0.14) 0%, rgba(180,150,110,0.06) 45%, transparent 100%)', accent: 'rgba(181,106,76,0.05)', rays: 'rgba(255,238,210,0.28)' },
    winter: { sky: 'linear-gradient(180deg,#eef1f2 0%,#f5f5f1 55%,#e8e9e4 100%)', ground: 'linear-gradient(0deg, rgba(150,155,165,0.12) 0%, rgba(180,185,190,0.05) 45%, transparent 100%)', accent: 'rgba(150,160,180,0.04)', rays: 'rgba(245,245,250,0.2)' },
  };
```

- [ ] **Step 2: 替换阳光/云块为柔和版（sunny 分支）**

把 sunny 分支中的太阳 div 与 godRays div 替换为：

```tsx
      {weather === 'sunny' && (
        <>
          <div className="parallax-slow absolute" style={{
            top: '5%', left: '55%',
            width: 'clamp(120px, 20vw, 240px)', height: 'clamp(120px, 20vw, 240px)',
            background: 'radial-gradient(circle, rgba(249,232,200,0.9) 0%, rgba(242,213,160,0.4) 35%, rgba(242,213,160,0) 68%)',
            borderRadius: '50%', zIndex: 2,
            animation: 'sunPulse 9s ease-in-out infinite',
          }} />
          <div className="absolute inset-0" style={{
            zIndex: 3,
            background: 'linear-gradient(180deg, rgba(255,248,235,0.28) 0%, rgba(255,252,246,0.12) 40%, transparent 70%)',
          }} />
        </>
      )}
```

- [ ] **Step 3: 移除照片纹理层，替换为线稿插画**

删除这一行：

```tsx
      <div className="absolute inset-0" style={{ zIndex: 1, opacity: 0.06, background: 'url(/assets/scene/misty-trees.jpg) center/cover no-repeat', filter: 'brightness(1.5) blur(1px)' }} />
```

并在 Ground 之后追加线稿插画块：

```tsx
      {/* 简约线稿插画：地平线 + 树 */}
      <div className="absolute inset-0" style={{ zIndex: 2, pointerEvents: 'none' }}>
        <svg viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 'auto 0 0 0', width: '100%', height: '42%', opacity: 0.9 }}>
          <line x1="0" y1="330" x2="1440" y2="330" stroke="rgba(60,52,40,0.14)" strokeWidth="1.2" />
          <g stroke="rgba(60,52,40,0.5)" strokeWidth="2.4" strokeLinecap="round" fill="none">
            <path d="M260 332 C256 296 250 268 262 234" />
            <path d="M264 262 C238 244 222 246 206 228 M264 246 C244 228 238 220 226 200" />
            <path d="M1170 334 C1174 300 1180 274 1168 244" />
            <path d="M1168 270 C1192 254 1206 256 1220 240 M1168 254 C1186 238 1192 230 1202 212" />
          </g>
          <circle cx="206" cy="228" r="7" fill="rgba(201,138,75,0.5)" />
          <circle cx="226" cy="200" r="6" fill="rgba(217,160,94,0.5)" />
          <circle cx="1220" cy="240" r="6" fill="rgba(201,138,75,0.5)" />
          <circle cx="1202" cy="212" r="5" fill="rgba(217,160,94,0.5)" />
          <path d="M180 340 C320 322 480 322 620 340" stroke="rgba(60,52,40,0.22)" strokeWidth="1.2" />
          <path d="M860 344 C1020 328 1180 328 1300 344" stroke="rgba(60,52,40,0.2)" strokeWidth="1.2" />
        </svg>
      </div>
```

- [ ] **Step 4: 运行校验**

Run: `npm run lint && npm run build`
Expected: lint `0 errors`；build 成功（出现 ○ /park 与 ƒ API 列表）

- [ ] **Step 5: 提交**

```bash
git add components/park/ParkScene.tsx
git commit -m "style: refined line-art scene for park homepage"
```

---

### Task 3: 首页 Hero 与顶部控件

**Files:**
- Modify: `app/park/page.tsx`

- [ ] **Step 1: 替换欢迎区为简约 Hero**

把 `{/* Welcome hero */}` 块整体替换为：

```tsx
        {/* Welcome hero */}
        <div className="welcome-text relative px-4 md:px-0" style={{ paddingTop: 'clamp(72px, 14vh, 140px)', paddingLeft: '4vw', zIndex: 20 }}>
          <div className="flex flex-col items-start max-w-lg">
            <div className="kicker mb-5">AUTUMN PARK · 四季流转</div>
            <h1 className="m-0 text-[clamp(30px,5vw,52px)] leading-[1.22] font-medium tracking-wide">
              在秋天，<br />
              慢慢<em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>散步</em>。
            </h1>
            <p className="text-[13px] leading-[2] max-w-[300px] mb-7" style={{ color: 'var(--ink-faint)' }}>
              照片、留言与天气都安静地留在这里。向下走，逛逛这座公园。
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { if (session) enterCorner(session.userId, session.name); else setShowLogin(true); }}
                className="btn-primary"
              >
                进入公园 →
              </button>
              <button
                onClick={() => window.scrollTo({ top: window.innerHeight * 0.95, behavior: 'smooth' })}
                className="btn-ghost"
              >
                浏览相册
              </button>
            </div>
          </div>
        </div>
```

同时删除原欢迎区里的季节徽章与副标题（整块被上面替换掉）。

- [ ] **Step 2: 滚动提示改为细线样式**

把 `.scroll-hint` 内部内容整体替换为：

```tsx
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-px" style={{ background: 'rgba(60,52,40,0.22)' }} />
            <p className="m-0 text-[10px] tracking-[0.34em]" style={{ color: 'var(--ink-weak)' }}>向下漫步</p>
          </div>
```

- [ ] **Step 3: 运行校验**

Run: `npm run lint && npm run build`
Expected: 通过；页面 hero 文案变为新标题。

- [ ] **Step 4: 提交**

```bash
git add app/park/page.tsx
git commit -m "style: minimal hero layout with CTA actions"
```

---

### Task 4: 音乐播放器重构

**Files:**
- Modify: `lib/playlist.ts`
- Modify: `components/park/AmbientSound.tsx`

- [ ] **Step 1: 在 playlist.ts 增加曲目名映射**

在文件末尾追加：

```ts
// 曲目显示名（key 为 public 下音频路径）
export const TRACK_NAMES: Record<string, string> = {
  '/music/autumn-bench/canon.mp3': 'Canon in D',
  '/music/autumn-bench/air-in-g-minor.mp3': 'Air in G Minor',
  '/music/darkroom/gymnopedie.mp3': 'Gymnopédie No.1',
  '/music/starlit-camp/liebestraum.mp3': 'Liebestraum No.3',
  '/music/lighthouse-coast/adagio.mp3': 'Adagio in G Minor',
  '/music/lighthouse-coast/pavane.mp3': 'Pavane',
  '/music/bookstore/cello-suite.mp3': 'Cello Suite No.1',
};

export function trackName(url: string): string {
  return TRACK_NAMES[url] || url.split('/').pop()?.replace('.mp3', '') || 'Music';
}
```

- [ ] **Step 2: 重写 MusicPlayer 类**

把 `class MusicPlayer` 到 `setVolume` 结束的整个类替换为：

```ts
type PlayerState = { playing: boolean; trackName: string; index: number };

class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private playlist: string[] = [];
  private order: string[] = [];
  private currentIdx = 0;
  private vol = 0.3;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private stopped = true;
  private onState: ((s: PlayerState) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', () => this.autoStart(), { once: true });
      window.addEventListener('keydown', () => this.autoStart(), { once: true });
    }
  }

  setOnState(fn: (s: PlayerState) => void) { this.onState = fn; }

  private emit() {
    const track = this.audio && !this.stopped ? this.order[this.currentIdx] : null;
    this.onState?.({
      playing: Boolean(track),
      trackName: track ? trackName(track) : '',
      index: this.currentIdx,
    });
  }

  private autoStart() {
    if (this.stopped && this.playlist.length > 0 && !sessionStorage.getItem('park_music_off')) {
      this.startQuietly();
    }
  }

  private shuffle() {
    const arr = [...this.playlist];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private fadeTo(target: number, ms: number, done?: () => void) {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const el = this.audio;
    if (!el) { done?.(); return; }
    const from = el.volume;
    const steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    this.fadeTimer = setInterval(() => {
      i++;
      el.volume = from + (target - from) * (i / steps);
      if (i >= steps) {
        if (this.fadeTimer) clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        el.volume = target;
        done?.();
      }
    }, 50);
  }

  private playTrack(url: string, fadeIn = true) {
    this.stopAudio();
    const audio = new Audio(url);
    audio.volume = 0;
    audio.loop = false;
    audio.onended = () => this.next();
    audio.onerror = () => this.next();
    this.audio = audio;
    const p = audio.play();
    p?.catch(() => {});
    if (fadeIn) this.fadeTo(this.vol, 1200);
    else audio.volume = this.vol;
    this.emit();
  }

  startQuietly() {
    this.stopped = false;
    if (!this.audio && this.order.length === 0) {
      this.order = this.shuffle();
      this.currentIdx = 0;
      this.playTrack(this.order[0], true);
    } else if (this.audio) {
      this.audio.play()?.catch(() => {});
      this.fadeTo(this.vol, 1200);
      this.emit();
    }
  }

  async play(playlist: string[]) {
    if (playlist.length === 0) return false;
    this.playlist = playlist;
    this.order = this.shuffle();
    this.currentIdx = 0;
    this.stopped = false;
    this.playTrack(this.order[0], true);
    return true;
  }

  pause() {
    if (!this.audio || this.stopped) return;
    this.fadeTo(0, 500, () => { this.audio?.pause(); this.emit(); });
  }

  resume() {
    if (this.stopped || !this.audio) return;
    this.audio.play()?.catch(() => {});
    this.fadeTo(this.vol, 800);
    this.emit();
  }

  toggle() {
    if (this.stopped) { this.startQuietly(); return; }
    if (this.audio && !this.audio.paused) this.pause();
    else this.resume();
  }

  next() {
    if (this.order.length === 0) return;
    this.currentIdx = (this.currentIdx + 1) % this.order.length;
    this.playTrack(this.order[this.currentIdx], true);
  }

  prev() {
    if (this.order.length === 0) return;
    this.currentIdx = (this.currentIdx - 1 + this.order.length) % this.order.length;
    this.playTrack(this.order[this.currentIdx], true);
  }

  setVolume(v: number) {
    this.vol = Math.max(0, Math.min(1, v));
    if (this.audio && !this.audio.paused) this.fadeTo(this.vol, 200);
  }

  stop() {
    sessionStorage.setItem('park_music_off', '1');
    this.stopped = true;
    this.stopAudio();
    this.emit();
  }

  private stopAudio() {
    if (this.fadeTimer) { clearInterval(this.fadeTimer); this.fadeTimer = null; }
    if (this.audio) { this.audio.pause(); this.audio.onended = null; this.audio.onerror = null; this.audio = null; }
  }
}
```

注意：`stop()` 会写入 `sessionStorage`，因此用户主动关闭后本页会话内不再自动播放；`autoStart` 仅在未关闭时生效。

- [ ] **Step 3: 重写组件 UI 与状态**

把 `export default function AmbientSound` 的组件体（从 `const [soundOn...` 到 `hasWeatherSound` 前）替换为：

```tsx
export default function AmbientSound({ weather, scene }: AmbientSoundProps) {
  const [soundOn, setSoundOn] = useState(false);
  const [player, setPlayer] = useState<PlayerState>({ playing: false, trackName: '', index: 0 });
  const [volume, setVolume] = useState(0.3);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    musicPlayer.setOnState(setPlayer);
    return () => musicPlayer.setOnState(null);
  }, []);

  const toggleSound = useCallback(async () => {
    if (soundOn) { weatherAudio.stop(); setSoundOn(false); }
    else { const ok = await weatherAudio.play(weather); if (ok) setSoundOn(true); }
  }, [soundOn, weather]);

  const toggleMusic = useCallback(() => {
    if (player.playing) musicPlayer.pause();
    else if (musicPlayer.resumeSafe()) musicPlayer.resume();
    else {
      const playlist = (scene ? SCENE_PLAYLIST[scene] : null) || DEFAULT_PLAYLIST;
      musicPlayer.play(playlist);
    }
  }, [player.playing, scene]);

  // 天气变化时更新环境音
  useEffect(() => {
    if (loaded.current && soundOn) { weatherAudio.stop(); weatherAudio.play(weather).then(ok => { if (!ok) setSoundOn(false); }); }
  }, [weather]); // eslint-disable-line
  useEffect(() => { loaded.current = true; }, []);

  useEffect(() => () => { weatherAudio.stop(); musicPlayer.stop(); }, []);

  const hasWeatherSound = weather !== 'sunny' && weather !== 'cloudy';

  const changeVolume = (v: number) => {
    setVolume(v);
    musicPlayer.setVolume(v);
  };
```

并把 return 块整体替换为：

```tsx
  return (
    <div className="fixed bottom-4 left-4 z-25 flex gap-2 items-end max-md:bottom-4 max-md:left-2">
      {/* 天气音效 */}
      <button onClick={toggleSound}
        className={`chip ${soundOn ? '!border-[rgba(181,106,76,0.4)] !text-[#a25a3e]' : ''}`}
        title={soundOn ? '关闭天气音效' : '开启天气音效'}>
        <span>{soundOn ? '◍' : '○'}</span>
        <span className="hidden md:inline">{hasWeatherSound ? (soundOn ? '天气音效' : '天气音') : '无'}</span>
      </button>

      {/* 音乐 */}
      <div className="relative">
        <div className="chip cursor-pointer" onClick={toggleMusic} title={player.playing ? '暂停' : '播放'}>
          <span>{player.playing ? 'Ⅱ' : '▶'}</span>
          <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{player.trackName || '背景音乐'}</b>
          <button
            className="ml-1 text-[11px]"
            style={{ color: 'var(--ink-weak)' }}
            onClick={e => { e.stopPropagation(); setShowMusicPanel(v => !v); }}
            title="播放设置"
          >⋯</button>
        </div>
        {showMusicPanel && (
          <div className="glass-strong absolute bottom-11 left-0 w-56 p-4" style={{ zIndex: 30 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--ink)' }}>{player.trackName || '背景音乐'}</span>
              <span className="text-[10px]" style={{ color: 'var(--ink-weak)' }}>{player.playing ? '播放中' : '已暂停'}</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <button className="glass-btn !px-2.5 !py-1" onClick={() => musicPlayer.prev()} title="上一首">⏮</button>
              <button className="glass-btn !px-3 !py-1" onClick={() => musicPlayer.toggle()} title="播放/暂停">{player.playing ? '暂停' : '播放'}</button>
              <button className="glass-btn !px-2.5 !py-1" onClick={() => musicPlayer.next()} title="下一首">⏭</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: 'var(--ink-weak)' }}>音量</span>
              <input
                type="range" min="0" max="1" step="0.05" value={volume}
                onChange={e => changeVolume(parseFloat(e.target.value))}
                className="flex-1" style={{ accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
```

并在组件内补充 `resumeSafe` 兼容方法（MusicPlayer 类中追加）：

```ts
  resumeSafe(): boolean {
    return this.playlist.length > 0 && !this.stopped;
  }
```

- [ ] **Step 4: 更新 imports**

把文件顶部 import 改为：

```ts
import { SCENE_PLAYLIST, DEFAULT_PLAYLIST, trackName } from '@/lib/playlist';
```

`PlayerState` 类型定义放在 `MusicPlayer` 类之前。

- [ ] **Step 5: 运行校验**

Run: `npm run lint && npm run build`
Expected: 通过。

- [ ] **Step 6: 提交**

```bash
git add lib/playlist.ts components/park/AmbientSound.tsx
git commit -m "feat: music player with track names, volume, fade and soft autoplay"
```

---

### Task 5: 照片墙简约化

**Files:**
- Modify: `components/park/PublicPath.tsx`

- [ ] **Step 1: Tab 切换改细分隔线样式**

把视图切换按钮区替换为：

```tsx
      <div className="fixed top-16 right-4 md:right-[296px] z-20 flex items-center gap-1 pointer-events-auto max-md:top-14 max-md:right-2"
        style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid var(--hairline)', borderRadius: 999, padding: 4 }}>
        {(['walk', 'gallery'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="px-3 py-1 text-[11px] rounded-full transition-colors"
            style={{
              color: viewMode === mode ? 'var(--ink)' : 'var(--ink-weak)',
              background: viewMode === mode ? 'rgba(60,52,40,0.06)' : 'transparent',
              letterSpacing: '0.1em',
            }}
          >
            {mode === 'walk' ? '漫步' : '画廊'}
          </button>
        ))}
        <span className="pl-2 pr-1 text-[10px] font-mono" style={{ color: 'var(--ink-weak)' }}>{photos.length}</span>
      </div>
```

- [ ] **Step 2: 照片卡片加悬浮效果**

给照片卡片容器（含 `polaroid-card` 的元素）追加 `card-hover` 类：在照片卡外层 className 中加入 `card-hover`。

- [ ] **Step 3: 运行校验**

Run: `npm run lint && npm run build`
Expected: 通过。

- [ ] **Step 4: 提交**

```bash
git add components/park/PublicPath.tsx
git commit -m "style: minimal photo wall tabs and card hover"
```

---

### Task 6: 留言墙简约化

**Files:**
- Modify: `components/park/MessageWall.tsx`

- [ ] **Step 1: 去掉彩色便签，改白卡 + 色点**

删除 `NOTE_COLORS` 常量，把留言卡片渲染改为：

```tsx
          {messages.map(m => (
            <div key={m.id} className="card-hover" style={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, flex: 'none',
                background: { amber: '#c98a4b', rose: '#b56a4c', sky: '#8faeb8', violet: '#9b8fb8', emerald: '#8fa184', slate: '#9aa3ad' }[m.color] || '#c98a4b' }} />
              <div style={{ flex: 1 }}>
                <p className="m-0 text-[13px] leading-[1.8]" style={{ color: 'var(--ink-soft)' }}>{m.content}</p>
                <p className="m-0 mt-1 text-[10px]" style={{ color: 'var(--ink-weak)' }}>{m.created_at?.replace('T', ' ').slice(0, 16)}</p>
              </div>
            </div>
          ))}
```

- [ ] **Step 2: 移动端按钮换胶囊**

把移动端 toggle 按钮 className 改为 `chip md:hidden`。

- [ ] **Step 3: 运行校验**

Run: `npm run lint && npm run build`
Expected: 通过。

- [ ] **Step 4: 提交**

```bash
git add components/park/MessageWall.tsx
git commit -m "style: minimal message wall cards"
```

---

### Task 7: 天气投票与统计胶囊

**Files:**
- Modify: `components/weather/WeatherVote.tsx`
- Modify: `components/park/StatsBar.tsx`

- [ ] **Step 1: WeatherVote 容器与按钮换 chip**

把根容器 `className="fixed bottom-4 left-4 z-25 max-md:bottom-16 max-md:left-2"` 保持不变；把展开面板（`glass-strong`）保留；把面板内投票按钮的 `glass-btn` 保留（Task 1 已全局换新）。仅把折叠时的按钮文案/图标改为 chip 风格：

```tsx
      {!data ? null : (
        <button onClick={() => setExpanded(v => !v)} className="chip">
          <span>☀</span> 明日天气投票 <span style={{ color: 'var(--ink-weak)' }}>{Object.values(data.voteCounts).reduce((a, b) => a + b, 0)}</span>
        </button>
      )}
```

- [ ] **Step 2: StatsBar 换细胶囊**

把 StatsBar 的容器类从 `glass` 改为 `chip`，并删除 `pointer-events-none` 以外的多余背景类：

```tsx
      <div className="chip">
```

文字颜色改为 `var(--ink-soft)` / `var(--ink-weak)`。

- [ ] **Step 3: 运行校验**

Run: `npm run lint && npm run build`
Expected: 通过。

- [ ] **Step 4: 提交**

```bash
git add components/weather/WeatherVote.tsx components/park/StatsBar.tsx
git commit -m "style: minimal weather vote and stats chips"
```

---

### Task 8: 登录注册与用户菜单

**Files:**
- Modify: `components/auth/LoginModal.tsx`
- Modify: `components/auth/UserMenu.tsx`

- [ ] **Step 1: LoginModal 容器与控件**

把外层遮罩 `bg-black/70` 改为 `bg-black/40`；把卡片 `glass-strong p-6 w-80` 保持；标题 `text-white/80` 改为 `style={{ color: 'var(--ink)' }}`；Tab 按钮颜色改为 `var(--ink)` / `var(--ink-weak)`，激活态下边框 `var(--accent)`；输入框保留 `glass-input`（已换新）；提交按钮保留 `btn-primary`；错误文案改 `#b0563c`。

- [ ] **Step 2: UserMenu 换 chip**

把 UserMenu 三个元素改为：

```tsx
    <div className="fixed top-4 z-30 flex items-center gap-2 right-4 md:right-[296px]">
      <div className="chip">
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-2)' }} />
        <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{session.name}</span>
      </div>
      <button onClick={onEnterCorner} className="glass-btn">我的角落</button>
      {session.role === 'operator' && (
        <button onClick={onOpenAdmin} className="btn-ghost !py-1.5">管理</button>
      )}
      <button onClick={onLogout} className="btn-ghost !py-1.5 text-[11px]">离开</button>
    </div>
```

- [ ] **Step 3: 运行校验**

Run: `npm run lint && npm run build`
Expected: 通过。

- [ ] **Step 4: 提交**

```bash
git add components/auth/LoginModal.tsx components/auth/UserMenu.tsx
git commit -m "style: minimal login modal and user menu"
```

---

### Task 9: 滚动/过渡/交互动效

**Files:**
- Modify: `components/park/GSAPAnimations.tsx`
- Modify: `components/park/MessageWall.tsx`（根容器加 `.reveal`）
- Modify: `components/park/PublicPath.tsx`（相册区加 `.reveal`）

- [ ] **Step 1: 重写 GSAPAnimations**

整个文件替换为：

```tsx
'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function GSAPAnimations() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const timer = setTimeout(() => {
      gsap.from('.welcome-text', { opacity: 0, y: 30, duration: 1, ease: 'power3.out' });
      gsap.from('.scroll-hint', { opacity: 0, duration: 0.8, delay: 0.8 });

      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('.parallax-slow').forEach((el) => {
        gsap.to(el, {
          yPercent: 18,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });
      });
    }, 400);

    return () => { clearTimeout(timer); ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return null;
}
```

- [ ] **Step 2: 给区块加 reveal 类**

- `MessageWall.tsx`：最外层容器 className 追加 `reveal`。
- `PublicPath.tsx`：照片网格/画廊外层容器 className 追加 `reveal`。
- `ParkScene.tsx`：Task 2 已给阳光加了 `parallax-slow`；云朵 div 也各加 `parallax-slow`。

- [ ] **Step 3: 运行校验**

Run: `npm run lint && npm run build`
Expected: 通过。

- [ ] **Step 4: 提交**

```bash
git add components/park/GSAPAnimations.tsx components/park/MessageWall.tsx components/park/PublicPath.tsx components/park/ParkScene.tsx
git commit -m "feat: scroll reveal and parallax motion"
```

---

### Task 10: 粒子调优

**Files:**
- Modify: `lib/particles.ts`

- [ ] **Step 1: 更新秋季/季节粒子配置**

把 `SEASON_PARTICLES` 中的 autumn 行替换为：

```ts
  autumn: { type: 'leaf', colors: ['#c98a4b', '#b56a4c', '#d9a05e'], count: 18, minSize: 4, maxSize: 10, minSpeed: 0.12, maxSpeed: 0.35 },
```

- [ ] **Step 2: 尊重 reduced-motion**

在 `ParticleOverlay.tsx` 的 effect 开头加：

```ts
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
```

- [ ] **Step 3: 运行校验**

Run: `npm run lint && npm run build`
Expected: 通过。

- [ ] **Step 4: 提交**

```bash
git add lib/particles.ts components/park/ParticleOverlay.tsx
git commit -m "style: tuned autumn particles and reduced-motion support"
```

---

### Task 11: 全量验证与上线

**Files:**
- 全仓

- [ ] **Step 1: lint + build**

Run: `npm run lint`
Expected: `0 errors`

Run: `npm run build`
Expected: 成功，`/park` 与全部 API 路由在输出列表。

- [ ] **Step 2: 浏览器回归**

用 playwright-cli 打开 `https://autumn-park.onrender.com/park`（部署后）或本地 `http://localhost:3100/park`：

```bash
playwright-cli open http://localhost:3100/park
```

检查项：
- Console 无 error（最多允许 0 error）
- 页面出现「在秋天」标题与「进入公园」按钮
- 音乐胶囊显示曲目名，点击出现设置面板，音量滑块可用
- 375px 宽度无横向溢出（`playwright-cli resize 375 700` 后 `eval` 检查 `document.documentElement.scrollWidth <= 375`）

- [ ] **Step 3: 提交并推送**

```bash
git push origin master
```

- [ ] **Step 4: 确认 Render 部署 live**

用 Render API 轮询 `deploys?limit=1` 直到 `status=live` 且 commit 为最新提交。

- [ ] **Step 5: 线上复测**

重复 Step 2 的检查，URL 改为 `https://autumn-park.onrender.com/park`。

---

## 自检记录

- 规格覆盖：视觉令牌（Task 1）、首页（Task 2/3）、音乐（Task 4）、照片墙（Task 5）、留言墙（Task 6）、天气/统计（Task 7）、登录/用户菜单（Task 8）、动效（Task 9）、粒子（Task 10）、验证上线（Task 11）。
- 无占位符：所有代码步骤均为可直接使用的完整代码。
- 类型一致：`PlayerState`、`trackName()`、`musicPlayer.resumeSafe()` 均在 Task 4 内定义并使用；`.reveal` / `.parallax-slow` 在 Task 9 中统一。
