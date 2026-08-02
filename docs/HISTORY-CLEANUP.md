# Git 历史瘦身（可选）

> ⚠️ 该操作会**重写 git 历史**并需要 force push，属于破坏性操作。
> 执行前请备份仓库，并通知所有协作者。

仓库历史中包含 `uploads/`（约 400MB 照片，其中可能包含私密照片），以及若干明文密钥。

## 准备

```bash
# 1. 安装 git-filter-repo（Python）
pip install git-filter-repo

# 2. 克隆一份全新镜像（不要在现有工作副本上操作）
git clone --mirror https://github.com/gdten666-afk/autumn-park.git autumn-park.git
cd autumn-park.git
```

## 清理

```bash
# 删除 uploads 目录的所有历史
git filter-repo --path uploads --invert-paths

# 删除历史中的明文密钥文件（如有）
git filter-repo --path render.yaml --path fly.toml --invert-paths

# 压缩对象
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## 推送

```bash
git remote add origin https://github.com/gdten666-afk/autumn-park.git
git push --force --all
git push --force --tags
```

## 推送后

- 所有协作者执行 `git fetch --all && git reset --hard origin/main` 或重新克隆。
- **再次确认** Turso 令牌已轮换、`SESSION_SECRET` 与 `BOOTSTRAP_CODE` 已更换（历史里的旧值即使删除，也视为已泄露）。
