import type { PowerUpType } from '../types/game';

export const PALETTE = {
  ink: '#040814',
  inkAlt: '#071327',
  cyan: '#58f2ff',
  cyanDim: '#1c5e8c',
  magenta: '#ff54d9',
  magentaDim: '#73347a',
  lime: '#c8ff57',
  amber: '#ffb54a',
  red: '#ff5a77',
  white: '#effcff',
  slate: '#6c91a8',
  grid: '#16314f',
  panel: '#091221',
} as const;

export const HUD_FONT_FAMILY = '"Lucida Console", Monaco, monospace';

export const POWER_UP_LABELS: Record<PowerUpType, string> = {
  'rapid-fire': 'RAPID FIRE',
  'double-shot': 'DOUBLE SHOT',
  shield: 'SHIELD READY',
};

export const POWER_UP_COLORS: Record<PowerUpType, string> = {
  'rapid-fire': PALETTE.cyan,
  'double-shot': PALETTE.magenta,
  shield: PALETTE.lime,
};
