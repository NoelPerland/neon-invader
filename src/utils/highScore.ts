import { STORAGE_KEYS } from '../config/app';

const sanitizeHighScore = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
};

export const getStoredHighScore = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    if (!raw) {
      return 0;
    }

    return sanitizeHighScore(Number(raw));
  } catch {
    return 0;
  }
};

export const setStoredHighScore = (score: number): number => {
  const nextScore = sanitizeHighScore(score);

  if (typeof window === 'undefined') {
    return nextScore;
  }

  try {
    window.localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, String(nextScore));
  } catch {
    // Storage access can fail in restricted browser contexts; gameplay still works.
  }

  return nextScore;
};

export const updateStoredHighScore = (score: number): number => {
  const current = getStoredHighScore();
  if (score <= current) {
    return current;
  }

  return setStoredHighScore(score);
};
