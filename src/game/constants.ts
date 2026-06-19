export const DIRECTION = {
  IDLE: 0,
  UP: 1,
  DOWN: 2,
} as const;

export type Direction = (typeof DIRECTION)[keyof typeof DIRECTION];

export const ROUNDS = [5, 5, 3, 3, 2] as const;
export const ROUND_NAMES = [
  'Warm Up',
  'Rally',
  'Speed Run',
  'Sudden Death',
  'Final Boss',
] as const;
export const COLORS = [
  '#1a1a2e',
  '#16213e',
  '#0f3460',
  '#1b1b3a',
  '#2d1b4e',
] as const;

export const GAME_WIDTH = 1600;
export const GAME_HEIGHT = 900;
export const HIGH_SCORE_KEY = 'pongHighScore';

export const INTRO_SUBTITLE =
  'Beat the CPU across 5 rounds. Each round gets faster and tougher. First to the target score wins the round.';
