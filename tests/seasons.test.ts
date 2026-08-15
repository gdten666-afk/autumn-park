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
  it('跨年过渡（次年 2 月底 → 春季）', () => {
    // 冬季边界在 12/1（前一年），春季边界 3/1 在次年；2/25 处于跨年过渡窗口
    const s = state('2027-02-25');
    expect(s.season).toBe('winter');
    expect(s.secondarySeason).toBe('spring');
    expect(s.transitionWeight).toBeCloseTo(3 / 7, 5);
  });
});
