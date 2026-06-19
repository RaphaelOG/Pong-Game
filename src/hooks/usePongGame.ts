import { useEffect, useRef, useState } from 'react';
import { PongEngine } from '../game/PongEngine';
import { INTRO_SUBTITLE, ROUNDS } from '../game/constants';
import type { HudState, OverlayState } from '../game/types';

const initialHud: HudState = {
  playerScore: 0,
  aiScore: 0,
  roundDisplay: `1 / ${ROUNDS.length}`,
  targetScore: ROUNDS[0],
};

const initialOverlay: OverlayState = {
  visible: true,
  title: 'PONG',
  subtitle: INTRO_SUBTITLE,
  hint: 'Press any key to start',
};

export function usePongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState<HudState>(initialHud);
  const [highScore, setHighScore] = useState(0);
  const [status, setStatus] = useState('Ready');
  const [overlay, setOverlay] = useState<OverlayState>(initialOverlay);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new PongEngine(canvas, {
      onHudUpdate: setHud,
      onOverlay: setOverlay,
      onStatus: setStatus,
      onHighScore: setHighScore,
    });

    return () => engine.destroy();
  }, []);

  return { canvasRef, hud, highScore, status, overlay };
}
