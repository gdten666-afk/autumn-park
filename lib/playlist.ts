// lib/playlist.ts — Music playlist configuration
// 音频文件在 public/music/<scene>/ 下（AAC/M4A，全平台兼容）。

export const SCENE_PLAYLIST: Partial<Record<string, string[]>> = {
  'autumn-bench': [
    '/music/autumn-bench/canon.m4a',
    '/music/autumn-bench/air-in-g-minor.m4a',
  ],
  'darkroom': [
    '/music/darkroom/gymnopedie.m4a',
  ],
  'starlit-camp': [
    '/music/starlit-camp/liebestraum.m4a',
  ],
  'lighthouse-coast': [
    '/music/lighthouse-coast/adagio.m4a',
    '/music/lighthouse-coast/pavane.m4a',
  ],
  'bookstore': [
    '/music/bookstore/cello-suite.m4a',
  ],
};

export const DEFAULT_PLAYLIST: string[] = [
  '/music/autumn-bench/canon.m4a',
  '/music/autumn-bench/air-in-g-minor.m4a',
  '/music/darkroom/gymnopedie.m4a',
  '/music/starlit-camp/liebestraum.m4a',
  '/music/lighthouse-coast/adagio.m4a',
  '/music/lighthouse-coast/pavane.m4a',
  '/music/bookstore/cello-suite.m4a',
];

// 曲目显示名（key 为 public 下音频路径）
export const TRACK_NAMES: Record<string, string> = {
  '/music/autumn-bench/canon.m4a': 'Canon in D',
  '/music/autumn-bench/air-in-g-minor.m4a': 'Air in G Minor',
  '/music/darkroom/gymnopedie.m4a': 'Gymnopédie No.1',
  '/music/starlit-camp/liebestraum.m4a': 'Liebestraum No.3',
  '/music/lighthouse-coast/adagio.m4a': 'Adagio in G Minor',
  '/music/lighthouse-coast/pavane.m4a': 'Pavane',
  '/music/bookstore/cello-suite.m4a': 'Cello Suite No.1',
};

export function trackName(url: string): string {
  return TRACK_NAMES[url] || url.split('/').pop()?.replace(/\.(mp3|m4a)$/, '') || 'Music';
}
