import { POWER_UP_LABELS } from '../config/theme';
import type { PowerUpType } from '../types/game';

export const formatScore = (score: number): string => score.toString().padStart(5, '0');

export const formatLives = (lives: number): string => lives.toString().padStart(2, '0');

export const formatWave = (wave: number): string => wave.toString().padStart(2, '0');

export const formatPowerUpStatus = (
  type: PowerUpType | null,
  expiresAt: number | null,
  now: number,
): string => {
  if (!type) {
    return 'NONE';
  }

  if (type === 'shield' || !expiresAt) {
    return POWER_UP_LABELS[type];
  }

  const remainingSeconds = Math.max(0, Math.ceil((expiresAt - now) / 100) / 10);
  return `${POWER_UP_LABELS[type]} ${remainingSeconds.toFixed(1)}S`;
};
