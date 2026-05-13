import type { EnemyRank, PowerUpType } from '../types/game';

export const TEXTURES = {
  player: 'player-ship',
  bulletPlayer: 'bullet-player',
  bulletEnemy: 'bullet-enemy',
  particle: 'impact-particle',
  starfield: 'starfield-tile',
  scanlines: 'scanlines-tile',
  enemyTop: 'enemy-top',
  enemyMid: 'enemy-mid',
  enemyBottom: 'enemy-bottom',
  rapidFire: 'powerup-rapid-fire',
  doubleShot: 'powerup-double-shot',
  shield: 'powerup-shield',
} as const;

export const ENEMY_TEXTURES: Record<EnemyRank, string> = {
  top: TEXTURES.enemyTop,
  mid: TEXTURES.enemyMid,
  bottom: TEXTURES.enemyBottom,
};

export const POWER_UP_TEXTURES: Record<PowerUpType, string> = {
  'rapid-fire': TEXTURES.rapidFire,
  'double-shot': TEXTURES.doubleShot,
  shield: TEXTURES.shield,
};
