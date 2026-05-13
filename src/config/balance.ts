import { GAME_HEIGHT } from './app';
import type { PowerUpType, WaveConfig } from '../types/game';

export const PLAYER_LIVES = 3;

export const PLAYER_SETTINGS = {
  speed: 360,
  spawnY: GAME_HEIGHT - 72,
  baseShotCooldown: 235,
  rapidFireCooldown: 102,
  bulletSpeed: 660,
  bulletOffsetY: 28,
  doubleShotSpreadX: 16,
  doubleShotVelocityX: 108,
  invulnerabilityMs: 1050,
  pickupGraceMs: 260,
  shieldGraceMs: 280,
} as const;

export const ENEMY_LAYOUT = {
  startY: 140,
  horizontalSpacing: 68,
  verticalSpacing: 50,
  sidePadding: 112,
  loseLineY: GAME_HEIGHT - 146,
} as const;

export const SCORE_BY_RANK = {
  bottom: 10,
  mid: 20,
  top: 30,
} as const;

export const POWER_UP_SETTINGS = {
  durationMs: 8200,
  fallSpeed: 96,
  weights: {
    'rapid-fire': 0.4,
    'double-shot': 0.35,
    shield: 0.25,
  } satisfies Record<PowerUpType, number>,
} as const;

export const WAVE_SETTINGS: WaveConfig[] = [
  {
    index: 1,
    rows: 4,
    cols: 7,
    formationSpeed: 56,
    stepDown: 16,
    enemyFireInterval: 1620,
    maxEnemyBullets: 1,
    enemyBulletSpeed: 210,
    dropChance: 0.18,
  },
  {
    index: 2,
    rows: 4,
    cols: 8,
    formationSpeed: 74,
    stepDown: 18,
    enemyFireInterval: 1260,
    maxEnemyBullets: 2,
    enemyBulletSpeed: 244,
    dropChance: 0.14,
  },
  {
    index: 3,
    rows: 5,
    cols: 8,
    formationSpeed: 92,
    stepDown: 20,
    enemyFireInterval: 1030,
    maxEnemyBullets: 2,
    enemyBulletSpeed: 272,
    dropChance: 0.11,
  },
  {
    index: 4,
    rows: 5,
    cols: 9,
    formationSpeed: 118,
    stepDown: 24,
    enemyFireInterval: 840,
    maxEnemyBullets: 3,
    enemyBulletSpeed: 314,
    dropChance: 0.09,
  },
  {
    index: 5,
    rows: 6,
    cols: 9,
    formationSpeed: 144,
    stepDown: 26,
    enemyFireInterval: 720,
    maxEnemyBullets: 4,
    enemyBulletSpeed: 352,
    dropChance: 0.08,
  },
];

export const GAMEPLAY_TIMINGS = {
  startDelayMs: 320,
  waveTransitionMs: 1250,
  restartDelayMs: 900,
  bannerHoldMs: 900,
  waveIntroTweenMs: 320,
  enemyShotTelegraphMs: 140,
} as const;

export const FX_SETTINGS = {
  playerHitShake: 0.0048,
  enemyHitShake: 0.0012,
  flashMs: 96,
  hitBurstCount: 7,
} as const;
