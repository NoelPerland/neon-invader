export const GAME_TITLE = 'Neon Invader';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

export const SCENE_KEYS = {
  BOOT: 'boot',
  TITLE: 'title',
  GAME: 'game',
  GAME_OVER: 'game-over',
} as const;

export const DOM_IDS = {
  APP: 'app',
  ROOT: 'game-root',
} as const;

export const STORAGE_KEYS = {
  HIGH_SCORE: 'neon-invader-high-score',
} as const;
