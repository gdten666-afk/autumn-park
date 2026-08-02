# 秋日公园 — Autumn Park

一个随四季流转的数字公园：每个人在这里都有自己的角落。

- 四季场景与昼夜氛围，会随时间与季节变化
- 公共照片小径（漫步 / 画廊）与个人「角落」（场景、天气、照片、签名）
- 天气投票、留言墙、邀请码注册、管理员面板
- 背景音乐与天气音效（Web Audio + MP3 场景歌单）

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Turso / libsql（默认本地 SQLite 文件，可切换到 Turso 云库）
- sharp（图片压缩与缩略图）
- 图片存储：S3 兼容对象存储（Cloudflare R2 / AWS S3 / MinIO），未配置时自动回落到本地磁盘

## 本地开发

要求：Node.js 22+。

```bash
npm ci --legacy-peer-deps
cp .env.example .env.local   # 按需修改
npm run dev
```

打开 http://localhost:3000/park。

首次注册请使用 `BOOTSTRAP_CODE`（见 `.env.local`）作为邀请码，该账号会成为管理员。

> 注意：`data/` 目录会自动创建；管理员引导码只用于首次注册，之后请使用密码登录。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `BOOTSTRAP_CODE` | 生产建议 | 首个管理员的引导邀请码（默认 `park-founder-2026`，上线前请修改） |
| `SESSION_SECRET` | 生产必填 | 会话签名密钥，用 `openssl rand -hex 32` 生成 |
| `TURSO_DATABASE_URL` | 可选 | Turso 数据库 URL；缺省为本地 `file:./data/park.db` |
| `TURSO_AUTH_TOKEN` | Turso 时必填 | Turso 数据库令牌（**不要提交到仓库**） |
| `UPLOAD_DIR` | 可选 | 本地图片目录（默认 `./uploads`） |
| `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | 可选 | 配置后图片走 S3/R2 对象存储；不配置则用本地磁盘 |

完整说明见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 常用命令

```bash
npm run dev     # 开发
npm run build   # 生产构建
npm start       # 运行构建产物
npm run lint    # ESLint
```

## 目录结构

```text
app/            页面与 API 路由
  park/         公园主页
  api/          REST 接口（auth / photos / comments / messages / weather / admin / space / stats）
components/     前端组件（park / space / weather / auth / admin）
lib/            数据库、认证、存储、速率限制、季节/天气/粒子等逻辑
public/         静态资源（场景图、音乐）
uploads/        本地图片存储（已 gitignore）
```

## 部署

支持 Docker（standalone 输出）、Fly.io 与 Render。密钥与存储配置见 [DEPLOYMENT.md](DEPLOYMENT.md)。
