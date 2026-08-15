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
