import type { RefObject } from 'react';
import type { OverlayState } from '../game/types';

interface GameCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  overlay: OverlayState;
}

export function GameCanvas({ canvasRef, overlay }: GameCanvasProps) {
  return (
    <div className="game-wrapper">
      <canvas ref={canvasRef} />
      <div className={`overlay${overlay.visible ? '' : ' hidden'}`}>
        <div className="overlay-title">{overlay.title}</div>
        <div className="overlay-subtitle">{overlay.subtitle}</div>
        <div className="overlay-hint">{overlay.hint}</div>
      </div>
    </div>
  );
}
