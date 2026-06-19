import type { HudState } from '../game/types';

interface HeaderProps {
  hud: HudState;
  highScore: number;
}

export function Header({ hud, highScore }: HeaderProps) {
  return (
    <header>
      <h1>PONG</h1>
      <div className="hud">
        <div className="hud-item">
          <div className="hud-label">You</div>
          <div className="hud-value player-score">{hud.playerScore}</div>
        </div>
        <div className="hud-item">
          <div className="hud-label">Round</div>
          <div className="hud-value">{hud.roundDisplay}</div>
        </div>
        <div className="hud-item">
          <div className="hud-label">Target</div>
          <div className="hud-value">{hud.targetScore}</div>
        </div>
        <div className="hud-item">
          <div className="hud-label">CPU</div>
          <div className="hud-value ai-score">{hud.aiScore}</div>
        </div>
        <div className="hud-item">
          <div className="hud-label">Best</div>
          <div className="hud-value">{highScore}</div>
        </div>
      </div>
    </header>
  );
}
