export type PowerUpType = 'rapid-fire' | 'double-shot' | 'shield';

export type GameResult = 'victory' | 'defeat';

export type EnemyRank = 'top' | 'mid' | 'bottom';

export type SoundKey =
  | 'playerShoot'
  | 'enemyShoot'
  | 'enemyHit'
  | 'pickup'
  | 'playerHit'
  | 'gameOver'
  | 'waveClear';

export interface SessionState {
  score: number;
  highScore: number;
  lives: number;
  wave: number;
  activePowerUp: PowerUpType | null;
  powerUpExpiresAt: number | null;
  result: GameResult | null;
}

export interface WaveConfig {
  index: number;
  rows: number;
  cols: number;
  formationSpeed: number;
  stepDown: number;
  enemyFireInterval: number;
  maxEnemyBullets: number;
  enemyBulletSpeed: number;
  dropChance: number;
}

export interface GameOverData {
  score: number;
  highScore: number;
  wave: number;
  result: GameResult;
  isNewHighScore?: boolean;
}
