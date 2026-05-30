// lib/playlist.ts — Music playlist configuration
// Put your MP3 files in public/music/ and list them here per scene.
// Each scene plays a random track from its list, shuffling on repeat.

export const SCENE_PLAYLIST: Partial<Record<string, string[]>> = {
  'autumn-bench': [
    '/music/autumn-bench/canon.mp3',
    // Add more files here, e.g.:
    // '/music/autumn-bench/river-flows.mp3',
  ],
  'darkroom': [
    '/music/darkroom/gymnopedie.mp3',
  ],
  'starlit-camp': [
    '/music/starlit-camp/clair-de-lune.mp3',
  ],
  'lighthouse-coast': [
    '/music/lighthouse-coast/adagio.mp3',
  ],
  'bookstore': [
    '/music/bookstore/goldberg-aria.mp3',
  ],
};

// Fallback playlist used when current scene has no music configured
export const DEFAULT_PLAYLIST: string[] = [
  '/music/shared/canon.mp3',
];
