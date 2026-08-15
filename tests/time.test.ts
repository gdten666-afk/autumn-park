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
