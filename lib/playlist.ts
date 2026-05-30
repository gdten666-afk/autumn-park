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
