import type { Direction } from './constants';

export interface TrailPoint {
  x: number;
  y: number;
}

export interface Ball {
  width: number;
  height: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  trail: TrailPoint[];
}

export interface Paddle {
  width: number;
  height: number;
  x: number;
  y: number;
  score: number;
  move: Direction;
  speed: number;
  side: 'left' | 'right';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface HudState {
  playerScore: number;
  aiScore: number;
  roundDisplay: string;
  targetScore: number;
}

export interface OverlayState {
  visible: boolean;
  title: string;
  subtitle: string;
  hint: string;
}

export interface PongCallbacks {
  onHudUpdate: (hud: HudState) => void;
  onOverlay: (overlay: OverlayState) => void;
  onStatus: (status: string) => void;
  onHighScore: (score: number) => void;
}
