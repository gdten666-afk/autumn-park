# 秋日公园 · 全面焕新与优化设计规格

日期：2026-08-15 ｜ 状态：待用户审阅

## 1. 背景与目标

用户反馈：**① 视觉"丑" ② 运行"卡"**。经全库探索与基线实测（构建 ✅ / lint 0错54警 / axe 2 违规 / 首屏 JS ~948KB / 音乐 34MB），确认问题集中在：纸感设计完成度不足、双层粒子系统与全屏 backdrop-blur 拖慢渲染、移动端布局 bug（Quotes 压成 55px 细条 + body overflow:hidden）、无障碍系统性缺失、若干安全与部署隐患。

目标：在**视觉方向 A（精致编辑感）**下完成视觉焕新，并同步完成性能、SEO/可访问性、代码质量、部署四个维度的优化，**一次到位、分阶段提交**。

## 2. 已确认决策

| 议题 | 决策 |
|---|---|
| 视觉方向 | A · 精致编辑感（用户在伴同工具选择；B/C 落选） |
| 执行方案 | ① 全面焕新一次到位，分阶段提交逐步可验收 |
| 概念图反馈 | 报头+Hero 排版获用户点击认可（×2）；照片画框、便签留言墙作为整体概念"还不错"，用户补充"文案不自然" |
| Hero 标题机制 | **动态标题**：留言墙新增点赞，热度最高的留言成为主页大标题（用户明确要求） |
| 音乐压缩 | 可选优化：转 AAC 96k（实测省 ~24%）；源文件已为 128kbps MP3，收益有限，非关键路径 |
| 字体 | 沿用系统衬线（Georgia/Songti/SimSun），**不引入外部字体文件** |
| 动画库 | 移除 framer-motion（CSS 过渡替代）；保留 GSAP + ScrollTrigger |

## 3. 视觉设计（方向 A · 精致编辑感）

### 3.1 设计令牌（globals.css 全量替换）

| 令牌 | 值 | 用途 |
|---|---|---|
| 纸底 `--bg` | `#f6f0e4` | 页面底色 |
| 表面 `--surface` | `#fbf8f1` | 卡片/弹窗 |
| 墨色 `--ink` | `#26211a` | 主文字、实心按钮 |
| 次级文字 `--ink-soft` | `#5c5343` | 说明文字 |
| 弱文字 `--ink-weak` | `#8b7a63`（对比度 ≥4.5:1） | 时间戳、小标签（**替换现在的 #a29c90 2.6:1**） |
| 装饰弱字 `--ink-ghost` | `#b8a98d` | 仅装饰性期号/页码，不承载正文信息 |
| 强调 `--accent` | `#b0563c`（陶土红） | 强调词、选中态 |
| 次强调 `--accent-2` | `#c98a4b`（琥珀金） | 落叶、点缀 |
| 分隔线 `--hairline(-strong)` | `rgba(93,72,48,.14 / .22)` | 细边框 |
| 圆角 | 卡片 10px / 弹窗 14px / 胶囊 999px | |
| 阴影 | `0 2px 10px rgba(60,48,30,.05)`（悬浮 .10） | 极轻纸感 |
| 背景过渡 | `0.6s`（原 2s 是卡顿来源之一） | |
| 侧栏宽度 `--panel-w` | `200px`（桌面留言墙/侧栏统一 token，消除 296/320px 硬编码不一致） | |

所有正文对比度 ≥ WCAG AA 4.5:1。

### 3.2 各区块设计

- **报头 masthead**（新）：顶部通栏细线报头——左「秋日公园 AUTUMN PARK」，右「今日天气 ｜ ♪ 曲名 ｜ 登录/用户菜单」，下方 1px 分隔线。替代现在散落的胶囊控件；StatsBar **取消常驻展示**，其人数/照片/留言统计并入报头右端极简显示（移动端隐藏），天气投票面板保留左下。
- **Hero**：左侧竖排期号点缀（NO.03 — 秋日刊）、横线小标签「四季流转 · AUTUMN ISSUE」、衬线大标题（**内容为动态最热留言**，见 §4，以「」引号呈现）、斜体陶土红强调词、副文、实心/幽灵按钮。右侧保留精修线稿树场景（SVG 重画，含陶土/琥珀叶与黄昏标注文字）。
- **照片区**：白纸画框卡片（8px 内衬边 + 细边框），图下纸标签（文案 / 署名 / 日期）；漫步·画廊 Tab 重设计为报头风格胶囊；语录卡同样式。
- **留言墙**：右侧 200px 窄栏便签式（微微倾斜纸条 ±0.8°），每条留言带 **♥ 点赞按钮 + 计数**（新功能，见 §4）；输入区细边框圆角。
- **角落 / 登录 / 管理**：继承新令牌与报头风格；管理面板保持简洁实用。
- **移动端**：修复 Quotes `calc(100vw-320px)` 细条 bug（`md` 以下不扣侧栏宽）；修复 `body{overflow:hidden}` 全局锁滚动（逐页确认滚动容器）；底部控件收敛为单一工具栏（天气/音乐/留言入口）；留言墙移动端保留独立页但样式统一。

### 3.3 动效

- 保留：日光呼吸、云漂移、落叶（预生成渐变后的粒子系统）、GSAP 滚动显现与视差、季节背景 0.6s crossfade。
- 移除：全屏 backdrop-blur（雾天改透明度+渐变）；framer-motion 角落过渡（改 CSS opacity/scale 0.5s）。
- 所有 CSS/JS 动画服从 `prefers-reduced-motion: reduce`。

### 3.4 文案

- 报头/小标签：沿用「AUTUMN PARK · 四季流转」。
- Hero 大标题：**动态最热留言**（§4）；无留言时回退默认「在公园里，慢慢走。」（用户已否定「在秋天，慢慢散步。」）。
- Hero 副文（静态）：`照片和心事，都可以留在这里。`
- 滚动提示：「向下漫步」沿用。

## 4. 新功能：留言点赞 + 热度标题

用户要求："为每个留言点赞投票，热度最高的当做标题。"

### 4.1 数据

- 新表 `message_likes(message_id TEXT, user_id TEXT, created_at TEXT, PRIMARY KEY(message_id, user_id))`；索引 `idx_likes_message ON message_likes(message_id)`。由 `ensureTables()` 幂等迁移（新增到现有 CREATE TABLE IF NOT EXISTS 块）。
- messages 表不变。

### 4.2 API

- `POST /api/messages/like`：`{ id }`，需登录，**toggle 语义**（已赞→取消，未赞→点赞）；限流 30 次/分/用户；写后失效 `messages:*` 缓存。响应含最新 `likes` 与 `likedByMe`。
- `GET /api/messages`：响应每条留言附带 `likes` 计数；登录用户附带 `likedByMe` 标记。
- `GET /api/messages/hot`：返回点赞数最高的 1 条留言（含内容截断到 28 字），TTL 30s 缓存；无留言返回 `null`。供 Hero 使用。
- 运营删除留言（现有 DELETE）级联清理 likes（`DELETE FROM message_likes WHERE message_id = ?`）。

### 4.3 前端

- 留言墙卡片：♥ 按钮（未登录点击 → 打开登录弹窗；已登录 toggle，乐观更新）。
- ParkPage：挂载时 `GET /api/messages/hot`，渲染为 Hero 大标题（「内容…」+ 小注「—— 来自留言墙」）；**点赞/发帖事件后立即刷新 + 60s 兜底轮询**；无数据用默认标题。
- 点赞数变化不改变留言墙排序（仍按时间倒序），只影响 Hero 与点赞数显示。

### 4.4 边界与风险

- 一人一赞（PK 约束 + toggle）；需登录才能赞（防刷）；限流兜底。
- 敏感/违规留言由运营删除（已有权限），删除即从 Hero 候选移除。
- 超长留言截断 28 字展示于 Hero，完整内容仅在墙上。
- 冷启动（Fly 内存缓存丢失）时 Hero 回退默认标题，不影响首屏。

## 5. 性能设计（治"卡"）

1. **粒子系统合并重构**：`lib/particles.ts` 与 `SceneFrame.tsx` 内联粒子逻辑合并为一套共享实现；雨滴线性渐变**预生成**（每类型一个，绘制时平移复用），不再每帧 `createLinearGradient`；页面 `visibilitychange` 隐藏时暂停 rAF；canvas 按 devicePixelRatio 缩放。
2. **移除全屏 backdrop-filter**（ParkScene 雾层、WeatherLayer 模糊层）：改用半透明渐变+漂移雾块模拟。
3. **动画库瘦身**：CornerTransition 改用 CSS 过渡 → 移除 `framer-motion` 依赖；GSAP 保留。
4. **图片管线**：全站 `<img>` 补 `loading="lazy" decoding="async"`；`/api/photos/[id]` 补完整缓存头——thumb `public, max-age=31536000, immutable`，full/medium **私有照片改 `private`**（修复 CDN 共享缓存泄露风险，公开照片 `public, max-age=86400`）；ETag 改为内容哈希；`UPLOAD_DIR` 加 `turbopackIgnore` 注释修 NFT 追踪警告。
5. **音乐**：可选 ffmpeg 重编码 7 首 MP3 → AAC 96k（实测省 ~24%，.m4a 全平台兼容）；播放列表改为按需流式（现有行为）+ 首曲 `<link rel="preload">` 提示。默认仍为首次交互后播放。
6. **轮询智能化**：MessageWall/StatsBar 30s 轮询在 `document.hidden` 时暂停；消息轮询改为收到点赞/发帖事件后再主动刷新 + 低频兜底。
7. **清理死资产**：删除 `public/assets/scene/*.jpg`（9 张 1.2MB 已无引用）；评估 `SCENE_STYLES` 导出必要性。
8. **React Compiler 评估**：`reactCompiler: true` 试跑（Next 16 稳定特性）；若构建/行为正常则保留（减少重渲染），否则回退并记录。
9. `ParkScene` palette 提为模块常量；`getSeasonState()` 客户端重复计算合并。

## 6. SEO / 可访问性

- **SEO**：`app/layout.tsx` 补全 metadata（OpenGraph/Twitter/theme-color）+ `generateViewport`；新增 `app/sitemap.ts`、`app/robots.ts`、`app/icon.svg`（复用 tree-silhouette 风格）、`app/apple-icon`。canonical 使用环境变量 `NEXT_PUBLIC_SITE_URL`，未配置时省略 canonical 标签（不输出错误的 localhost 地址）。Hero 内容已有服务端预渲染保底（客户端组件构建期预渲染），保留。
- **语义地标**：补 `<main>`；报头用 `<header>`，留言墙/照片区用 `<section>` + 可见标题（修 axe 2 项违规）。
- **模态**：所有弹层（登录、照片放大、留言页、音乐面板、天气面板）加 `role="dialog"` / `aria-modal` / Escape 关闭 / 焦点移入与关闭后归还；图标按钮补 `aria-label`。
- **控件**：ScenePicker/WeatherPicker emoji 按钮补 `aria-pressed` + `aria-label`；输入框补 label/aria-label；图片 alt 用描述性文案（去掉通用 'photo'）。
- **对比度**：令牌升级（§3.1），弱字 #8b7a63 ≥4.5:1。
- **动效无障碍**：CSS 动画在 `prefers-reduced-motion` 下全局停用（media query 统一覆盖，含 framer-motion 移除后的残留、animate-pulse、sunPulse/cloudDrift/fogDrift）。

## 7. 代码质量与安全

1. **目录穿越修复（高危）**：`admin/photos`、`admin/users` 删除路径对 `p.filename` 先 `path.basename()` 白名单化再拼接。
2. **事务**：`admin/users` 多步删除包事务（删照片文件引用→删评论（含他人对 TA 照片的评论）→删照片→删 space→删用户）。
3. **迁移修复**：损坏 BLOB 跳过并计数（不再每轮卡死）；迁移 POST 后 `apiCacheClear('photos:public')`；brokenOnly 分支 deleteImageKeys 移入 try/catch。
4. **AdminPanel**：迁移循环 try/finally 复位按钮；state 驱动文案（去直接 DOM 变更）；`Number('')` clamp；双 fetch 加 AbortController。
5. **类型治理**：lint 54 警告收敛（`any` → 具名类型，重点 db/weather/admin）；`types.ts` 补 `display_name`/`bio`/`thumb_key` 等字段建模；register 路由 `role as any` 修复；`dbGet` 替代单行 `dbAll[0]`。
6. **异步 IO**：storage 本地模式 `readFileSync/writeFileSync` → `fs.promises`；admin 删除循环改 `fs.promises` + 并发限流。
7. **一致性**：PhotoModal 删除评论权限语义明确为「评论作者本人或照片主可删」；`c.user_id === photo.user_id` 用 `String()` 统一比较；profile `display_name` 空值校验；署名统一取 `display_name || name`。
8. **ensureTables 冷启动竞态**：`tablesReady` 改为保存初始化 Promise（低优先级，防止并发首调重复迁移）。
9. **photo_comments 级联**：删照片时显式清理（已有）；删除用户时一并清理。

## 8. 部署

- **TZ**：Dockerfile `ENV TZ=Asia/Shanghai`；fly.toml / render.yaml 同设（保证 `new Date()` 昼夜判定与日志时区正确）。
- **Docker 瘦身**：runner 阶段改纯净 `node:22-alpine`（去掉继承的 python3/make/g++）；确认 standalone 复制逻辑不变。
- **fly.toml**：`min_machines_running = 1`（消除冷启动、保住内存缓存）；`swap_size_mb` 增加（512MB 跑 sharp 的 OOM 缓冲）。
- **render.yaml**：启动时检测无 S3 配置且无持久盘时打警告日志（DEPLOYMENT.md 已有说明，配置加运行时提示）。

## 9. 不改的东西（YAGNI）

- 不新增页面路由（/park、/wall、/ 之外不加）。
- 除 §4 的点赞/热度 API 外，不新增其他 API；不换数据库；不改照片存储结构。
- 不换曲目；音乐压缩为可选步骤，不做强制。
- 不引入 UI 组件库、不引入外部字体。
- 管理后台不重排，仅继承新令牌样式。

## 10. 验证标准（完成定义）

1. `npm run lint`：**0 error**（警告目标 ≤10，仅保留可解释项）。
2. `npm run build`：通过且无 NFT 追踪警告。
3. 生产模式（`npm start`）浏览器回归：
   - 桌面 1440×900 + 移动 390×844：无控制台错误、无横向溢出；
   - Hero 默认标题、留言墙渲染、登录弹窗开合、音乐播放/暂停/切歌、天气投票、上传照片（本地盘）、角落进入/退出、管理面板、点赞 toggle、热度标题随点赞变化。
4. 性能对比：本地生产模式 Vitals 前后对比（TTFB/FCP/LCP/CLS 不劣化）；首屏 JS 总量下降（移除 framer-motion 后应显著）。
5. `agent-browser a11y` 审计：0 violation。
6. `prefers-reduced-motion` 模拟下：无粒子、无自动动画。
7. 移动端 Quotes/滚动 bug 修复验证（390px 截图与 DOM 检查）。

## 11. 实施顺序（供实施计划使用）

1. **阶段一 · 安全与后端加固**（不碰视觉）：目录穿越、事务、迁移修复、TZ、Docker 瘦身、异步 IO、缓存头/ETag/私有照片修复。
2. **阶段二 · 性能内核**：粒子系统合并重构、backdrop-filter 移除、framer-motion 移除、轮询智能化、死资产清理、turbopackIgnore 修复。
3. **阶段三 · 视觉焕新（方向 A）**：设计令牌、报头、Hero（含动态标题挂载点）、照片区、留言墙、角落/登录/管理样式、移动端布局修复。
4. **阶段四 · 点赞与热度标题**：迁移、API、前端交互、缓存与失效。
5. **阶段五 · SEO/可访问性收口**：metadata/sitemap/robots/icon、地标、模态语义、aria、对比度、reduced-motion 全覆盖。
6. **阶段六 · 验证**：§10 全部条目 + 回归截图存档。

---

*参考：现状分析见工作区 `autumn-park-analysis.md`（45 条问题清单与基线数据）。*
