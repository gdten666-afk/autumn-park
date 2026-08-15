import { describe, it, expect } from 'vitest';
import { trackName, DEFAULT_PLAYLIST, SCENE_PLAYLIST } from '@/lib/playlist';

describe('playlist', () => {
  it('已知曲目显示名', () => {
    expect(trackName('/music/autumn-bench/canon.m4a')).toBe('Canon in D');
  });
  it('未知曲目回退文件名', () => {
    expect(trackName('/music/x/unknown-song.m4a')).toBe('unknown-song');
  });
  it('默认歌单覆盖全部场景曲目', () => {
    const all = Object.values(SCENE_PLAYLIST).flat().filter(Boolean) as string[];
    for (const url of all) expect(DEFAULT_PLAYLIST).toContain(url);
  });
});
