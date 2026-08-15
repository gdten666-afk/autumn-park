import { describe, it, expect } from 'vitest';
import { countWinner } from '@/lib/weather';

describe('countWinner', () => {
  it('无票回退', () => {
    expect(countWinner([], 'sunny')).toBe('sunny');
  });
  it('最高票获胜', () => {
    expect(countWinner([
      { vote: 'sunny', cnt: 3 }, { vote: 'cloudy', cnt: 5 },
    ], 'sunny')).toBe('cloudy');
  });
  it('平票按优先级（sunny > cloudy > light-rain > fog > heavy-rain > snow）', () => {
    expect(countWinner([
      { vote: 'heavy-rain', cnt: 2 }, { vote: 'fog', cnt: 2 },
    ], 'sunny')).toBe('fog');
  });
});
