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
