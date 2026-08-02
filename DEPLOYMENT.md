# 部署与安全清单

## 上线前必做

### 1. 轮换已泄露的 Turso 令牌

旧版本仓库的 `render.yaml` 中硬编码过 Turso 数据库读写令牌，该令牌已经公开，**必须吊销**：

1. 登录 [Turso 控制台](https://console.turso.io)，进入数据库 → Settings → Tokens。
2. 删除/吊销旧令牌，创建一个新令牌（读写权限按需）。
3. 在 Render / Fly 的环境变量中设置：
   - `TURSO_DATABASE_URL`：数据库 URL
   - `TURSO_AUTH_TOKEN`：新令牌

### 2. 设置会话密钥

```bash
openssl rand -hex 32
```

把输出设置为环境变量 `SESSION_SECRET`（Render / Fly 各一份）。没有它，生产环境将打印警告且会话不安全。

### 3. 修改引导邀请码

`BOOTSTRAP_CODE` 的默认值 `park-founder-2026` 已公开，请改成一段只有你知道的随机字符串。管理员账号之后请一律使用密码登录（代码已禁止引导码免密登录管理员）。

### 4. 图片存储

- **推荐**：配置 Cloudflare R2（S3 兼容）。免费额度对个人站点足够，且不随实例生命周期丢失。
- 不配置 S3 时使用本地磁盘 `UPLOAD_DIR`：
  - Fly：使用 volume 挂载（见 `fly.toml`）。
  - Render 免费/基础套餐：磁盘是临时的，重启或重新部署会丢图，请务必使用 R2/S3 或 Render 的持久磁盘。

## Fly.io

```bash
fly launch
fly secrets set SESSION_SECRET=<random> BOOTSTRAP_CODE=<new-code> TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token>
# 如需对象存储：
fly secrets set S3_ENDPOINT=<endpoint> S3_REGION=auto S3_BUCKET=<bucket> S3_ACCESS_KEY_ID=<id> S3_SECRET_ACCESS_KEY=<secret>
fly deploy
```

## Render

在 Render 控制台（服务 → Environment）配置以下环境变量，然后部署：

- `SESSION_SECRET`、`BOOTSTRAP_CODE`、`TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`
- 使用对象存储时再加：`S3_ENDPOINT`、`S3_REGION`、`S3_BUCKET`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`

`render.yaml` 中不再包含任何密钥字段，只保留非敏感配置。

## Git 历史瘦身（可选，需 force push）

仓库历史中包含约 400MB 的上传照片。清理由 `docs/HISTORY-CLEANUP.md` 中的脚本完成；该操作会重写历史，需要你确认后执行。
