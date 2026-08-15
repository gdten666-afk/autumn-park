# tests/

纯逻辑模块的单元测试（vitest，node 环境）。

## 运行

```bash
npm test
```

## 范围

- `lib/seasons.ts`：季节边界与过渡窗口
- `lib/time.ts`：昼夜时段与进度
- `lib/cache.ts`：LRU 与 TTL 缓存
- `lib/rate-limit.ts`：滑动窗口限流
- `lib/playlist.ts`：曲目名与歌单完整性
- `lib/weather.ts`：天气投票计票（countWinner）

UI 与 API 的回归由 `agent-browser` 在生产模式下验证（见实施计划 Phase 6），不在此处。
