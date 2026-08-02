// lib/playlist.ts — Music playlist configuration
// Put MP3 files in public/music/<scene>/ and list them here.

export const SCENE_PLAYLIST: Partial<Record<string, string[]>> = {
  'autumn-bench': [
    '/music/autumn-bench/canon.mp3',
    '/music/autumn-bench/air-in-g-minor.mp3',
  ],
  'darkroom': [
    '/music/darkroom/gymnopedie.mp3',
  ],
  'starlit-camp': [
    '/music/starlit-camp/liebestraum.mp3',
  ],
  'lighthouse-coast': [
    '/music/lighthouse-coast/adagio.mp3',
    '/music/lighthouse-coast/pavane.mp3',
  ],
  'bookstore': [
    '/music/bookstore/cello-suite.mp3',
  ],
};

export const DEFAULT_PLAYLIST: string[] = [
  '/music/autumn-bench/canon.mp3',
];

// 曲目显示名（key 为 public 下音频路径）
export const TRACK_NAMES: Record<string, string> = {
  '/music/autumn-bench/canon.mp3': 'Canon in D',
  '/music/autumn-bench/air-in-g-minor.mp3': 'Air in G Minor',
  '/music/darkroom/gymnopedie.mp3': 'Gymnopédie No.1',
  '/music/starlit-camp/liebestraum.mp3': 'Liebestraum No.3',
  '/music/lighthouse-coast/adagio.mp3': 'Adagio in G Minor',
  '/music/lighthouse-coast/pavane.mp3': 'Pavane',
  '/music/bookstore/cello-suite.mp3': 'Cello Suite No.1',
};

export function trackName(url: string): string {
  return TRACK_NAMES[url] || url.split('/').pop()?.replace('.mp3', '') || 'Music';
}
