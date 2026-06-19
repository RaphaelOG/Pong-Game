import {
  COLORS,
  DIRECTION,
  GAME_HEIGHT,
  GAME_WIDTH,
  HIGH_SCORE_KEY,
  INTRO_SUBTITLE,
  ROUND_NAMES,
  ROUNDS,
} from './constants';
import type {
  Ball,
  HudState,
  OverlayState,
  Paddle,
  Particle,
  PongCallbacks,
} from './types';

function createBall(speed = 8): Ball {
  return {
    width: 20,
    height: 20,
    x: GAME_WIDTH / 2 - 10,
    y: GAME_HEIGHT / 2 - 10,
    vx: 0,
    vy: 0,
    speed,
    trail: [],
  };
}

function createPaddle(side: 'left' | 'right'): Paddle {
  return {
    width: 20,
    height: 200,
    x: side === 'left' ? 60 : GAME_WIDTH - 80,
    y: GAME_HEIGHT / 2 - 100,
    score: 0,
    move: DIRECTION.IDLE,
    speed: 10,
    side,
  };
}

function getAudioContextClass(): typeof AudioContext {
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  const Ctx = window.AudioContext ?? w.webkitAudioContext;
  if (!Ctx) throw new Error('Web Audio API is not supported');
  return Ctx;
}

export class PongEngine {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private callbacks: PongCallbacks;

  private player: Paddle;
  private ai: Paddle;
  private ball: Ball;
  private particles: Particle[] = [];

  private highScore: number;
  private muted = false;
  private paused = false;
  private running = false;
  private over = false;
  private turn: Paddle | null;
  private timer = 0;
  private round = 0;
  private color: string = COLORS[0];
  private countdown = 0;
  private countdownTimer = 0;
  private transitioning = false;
  private flashAlpha = 0;
  private hitFlash = 0;
  private audioCtx: AudioContext | null = null;
  private animationId: number | null = null;
  private boundResize: () => void;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: () => void;

  constructor(canvas: HTMLCanvasElement, callbacks: PongCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.context = ctx;
    this.callbacks = callbacks;

    this.highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    this.callbacks.onHighScore(this.highScore);

    this.player = createPaddle('left');
    this.ai = createPaddle('right');
    this.ai.speed = 6;
    this.ball = createBall();
    this.turn = this.ai;

    this.boundResize = () => this.resizeCanvas();
    this.boundKeyDown = (e) => this.handleKeyDown(e);
    this.boundKeyUp = () => {
      this.player.move = DIRECTION.IDLE;
    };

    this.resizeCanvas();
    window.addEventListener('resize', this.boundResize);
    document.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('keyup', this.boundKeyUp);

    this.updateHud();
    this.showOverlay('PONG', INTRO_SUBTITLE, 'Press any key to start');
    this.callbacks.onStatus('Ready');
    this.draw();
  }

  destroy(): void {
    this.running = false;
    this.over = true;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    window.removeEventListener('resize', this.boundResize);
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
  }

  private resizeCanvas(): void {
    const maxW = Math.min(window.innerWidth - 32, 1600);
    const maxH = Math.min(window.innerHeight - 200, 900);
    const scale = Math.min(maxW / GAME_WIDTH, maxH / GAME_HEIGHT);
    const displayW = Math.floor(GAME_WIDTH * scale);
    const displayH = Math.floor(GAME_HEIGHT * scale);
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = GAME_WIDTH * dpr;
    this.canvas.height = GAME_HEIGHT * dpr;
    this.canvas.style.width = `${displayW}px`;
    this.canvas.style.height = `${displayH}px`;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private initAudio(): void {
    if (!this.audioCtx) {
      this.audioCtx = new (getAudioContextClass())();
    }
    const ctx = this.audioCtx;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.08,
  ): void {
    if (this.muted || !this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  private showOverlay(title: string, subtitle: string, hint: string): void {
    const overlay: OverlayState = { visible: true, title, subtitle, hint };
    this.callbacks.onOverlay(overlay);
  }

  private hideOverlay(): void {
    this.callbacks.onOverlay({
      visible: false,
      title: '',
      subtitle: '',
      hint: '',
    });
  }

  private updateHud(): void {
    const hud: HudState = {
      playerScore: this.player.score,
      aiScore: this.ai.score,
      roundDisplay: `${this.round + 1} / ${ROUNDS.length}`,
      targetScore: ROUNDS[this.round] ?? ROUNDS[ROUNDS.length - 1],
    };
    this.callbacks.onHudUpdate(hud);
  }

  private spawnParticles(x: number, y: number, color: string, count = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: color || '#fff',
        size: 3 + Math.random() * 5,
      });
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;
      p.vy += 0.1;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private startGame(): void {
    this.initAudio();
    this.running = true;
    this.paused = false;
    this.hideOverlay();
    this.callbacks.onStatus(`Round ${this.round + 1}: ${ROUND_NAMES[this.round]}`);
    this.playTone(440, 0.15, 'sine', 0.1);
    this.loop();
  }

  private togglePause(): void {
    if (!this.running || this.over) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.showOverlay('PAUSED', 'Take a breather.', 'Press P to resume');
      this.callbacks.onStatus('Paused');
      if (this.animationId !== null) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    } else {
      this.hideOverlay();
      this.callbacks.onStatus(`Round ${this.round + 1}: ${ROUND_NAMES[this.round]}`);
      this.loop();
    }
  }

  private restart(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.running = false;
    this.over = false;
    this.paused = false;
    this.round = 0;
    this.color = COLORS[0];
    this.particles = [];
    this.player = createPaddle('left');
    this.ai = createPaddle('right');
    this.ai.speed = 6;
    this.ball = createBall();
    this.turn = this.ai;
    this.timer = 0;
    this.countdown = 0;
    this.transitioning = false;
    this.flashAlpha = 0;
    this.hitFlash = 0;
    this.updateHud();
    this.showOverlay('PONG', INTRO_SUBTITLE, 'Press any key to start');
    this.callbacks.onStatus('Ready');
    this.draw();
  }

  private endGame(won: boolean): void {
    this.over = true;
    this.running = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    let totalScore = this.player.score;
    for (let r = 0; r < this.round; r++) totalScore += ROUNDS[r];

    if (won && this.round >= ROUNDS.length - 1) {
      if (totalScore > this.highScore) {
        this.highScore = totalScore;
        localStorage.setItem(HIGH_SCORE_KEY, String(totalScore));
        this.callbacks.onHighScore(totalScore);
      }
      this.playTone(523, 0.2, 'sine', 0.12);
      setTimeout(() => this.playTone(659, 0.2, 'sine', 0.12), 200);
      setTimeout(() => this.playTone(784, 0.4, 'sine', 0.12), 400);
      this.showOverlay(
        'YOU WIN!',
        `You conquered all 5 rounds. New high score: ${this.highScore}.`,
        'Press R to play again',
      );
      this.callbacks.onStatus('Victory!');
    } else if (!won) {
      this.playTone(150, 0.5, 'sawtooth', 0.1);
      this.showOverlay(
        'GAME OVER',
        `The CPU won round ${this.round + 1} (${ROUND_NAMES[this.round]}).`,
        'Press R to try again',
      );
      this.callbacks.onStatus('Defeated');
    }
  }

  private advanceRound(): void {
    this.transitioning = true;
    this.playTone(600, 0.15, 'sine', 0.1);
    setTimeout(() => this.playTone(800, 0.25, 'sine', 0.1), 150);
    this.flashAlpha = 0.6;
    this.color = COLORS[(this.round + 1) % COLORS.length];
    this.player.score = 0;
    this.ai.score = 0;
    this.player.speed += 0.5;
    this.ai.speed += 0.8;
    this.ball.speed += 1.5;
    this.round++;
    this.updateHud();
    this.callbacks.onStatus(`Round ${this.round + 1}: ${ROUND_NAMES[this.round]}`);
    this.showOverlay(
      `ROUND ${this.round + 1}`,
      `${ROUND_NAMES[this.round]} — First to ${ROUNDS[this.round]} wins.`,
      'Get ready...',
    );
    setTimeout(() => {
      this.hideOverlay();
      this.countdown = 3;
      this.countdownTimer = Date.now();
      this.transitioning = false;
    }, 1500);
  }

  private resetTurn(victor: Paddle, loser: Paddle): void {
    this.ball = createBall(this.ball.speed);
    this.turn = loser;
    this.timer = Date.now();
    victor.score++;
    this.updateHud();
  }

  private turnDelayIsOver(): boolean {
    return Date.now() - this.timer >= 800;
  }

  private checkPaddleCollision(ball: Ball, paddle: Paddle, direction: 1 | -1): void {
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + paddle.width;
    const ballLeft = ball.x;
    const ballRight = ball.x + ball.width;

    if (ballRight < paddleLeft || ballLeft > paddleRight) return;
    if (ball.y + ball.height < paddle.y || ball.y > paddle.y + paddle.height) return;

    let hitPoint = (ball.y + ball.height / 2 - paddle.y) / paddle.height;
    hitPoint = Math.max(0, Math.min(1, hitPoint));
    const angle = (hitPoint - 0.5) * 1.2;

    ball.speed = Math.min(ball.speed + 0.3, 18);
    ball.vx = direction * ball.speed;
    ball.vy = ball.speed * angle;

    if (direction > 0) ball.x = paddleRight;
    else ball.x = paddleLeft - ball.width;

    this.hitFlash = 1;
    this.playTone(300 + ball.speed * 20, 0.08, 'square', 0.06);
    this.spawnParticles(ball.x + ball.width / 2, ball.y + ball.height / 2, '#ffffff', 6);
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.context;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private drawPaddle(paddle: Paddle, color: string): void {
    const ctx = this.context;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(255,255,255,0.8)');
    ctx.fillStyle = grad;
    this.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawParticles(): void {
    for (const p of this.particles) {
      this.context.globalAlpha = p.life;
      this.context.fillStyle = p.color;
      this.context.beginPath();
      this.context.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      this.context.fill();
    }
    this.context.globalAlpha = 1;
  }

  private draw(): void {
    const ctx = this.context;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const grad = ctx.createLinearGradient(0, 0, GAME_WIDTH, GAME_HEIGHT);
    grad.addColorStop(0, this.color);
    grad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    for (let gx = 0; gx < GAME_WIDTH; gx += 80) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let gy = 0; gy < GAME_HEIGHT; gy += 80) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(GAME_WIDTH, gy);
      ctx.stroke();
    }

    ctx.setLineDash([12, 20]);
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2, 30);
    ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT - 30);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();
    ctx.setLineDash([]);

    this.drawPaddle(this.player, '#00f5ff');
    this.drawPaddle(this.ai, '#ff6b6b');

    if (this.turnDelayIsOver() && this.countdown === 0) {
      for (let t = 0; t < this.ball.trail.length; t++) {
        const tr = this.ball.trail[t];
        const alpha = (t / this.ball.trail.length) * 0.4;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, (this.ball.width / 2) * (t / this.ball.trail.length), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15 + this.hitFlash * 20;
      ctx.fillStyle = '#ffffff';
      this.roundRect(this.ball.x, this.ball.y, this.ball.width, this.ball.height, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.font = 'bold 28px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText('YOU', this.player.x + this.player.width / 2, 50);
    ctx.fillText('CPU', this.ai.x + this.ai.width / 2, 50);

    if (this.countdown > 0) {
      ctx.font = 'bold 120px Orbitron, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = '#8c52ff';
      ctx.shadowBlur = 30;
      ctx.fillText(this.countdown.toString(), GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
      ctx.shadowBlur = 0;
    }

    this.drawParticles();
  }

  private update(): void {
    if (this.paused || this.over) return;

    this.updateParticles();
    if (this.flashAlpha > 0) this.flashAlpha -= 0.02;
    if (this.hitFlash > 0) this.hitFlash -= 0.05;

    if (this.transitioning || this.countdown > 0) {
      if (this.countdown > 0) {
        const elapsed = Date.now() - this.countdownTimer;
        if (elapsed >= 1000) {
          this.countdown--;
          this.countdownTimer = Date.now();
          if (this.countdown > 0) this.playTone(300 + this.countdown * 100, 0.1, 'sine', 0.08);
          else this.playTone(600, 0.2, 'sine', 0.1);
        }
      }
      return;
    }

    const { ball, player, ai } = this;

    if (ball.x <= 0) {
      this.resetTurn(ai, player);
      this.playTone(200, 0.3, 'sawtooth', 0.08);
      this.spawnParticles(40, ball.y, '#ff6b6b', 20);
      this.flashAlpha = 0.3;
    }
    if (ball.x >= GAME_WIDTH - ball.width) {
      this.resetTurn(player, ai);
      this.playTone(500, 0.2, 'sine', 0.1);
      this.spawnParticles(GAME_WIDTH - 40, ball.y, '#00f5ff', 20);
      this.flashAlpha = 0.3;
    }
    if (ball.y <= 0) {
      ball.vy = Math.abs(ball.vy);
      ball.y = 0;
    }
    if (ball.y >= GAME_HEIGHT - ball.height) {
      ball.vy = -Math.abs(ball.vy);
      ball.y = GAME_HEIGHT - ball.height;
    }

    if (player.move === DIRECTION.UP) player.y -= player.speed;
    else if (player.move === DIRECTION.DOWN) player.y += player.speed;
    player.y = Math.max(0, Math.min(GAME_HEIGHT - player.height, player.y));

    if (this.turnDelayIsOver() && this.turn) {
      const dir = this.turn === player ? -1 : 1;
      const angle = Math.random() * 0.8 - 0.4;
      ball.vx = dir * ball.speed;
      ball.vy = ball.speed * angle;
      ball.y = 150 + Math.random() * (GAME_HEIGHT - 300);
      this.turn = null;
      this.countdown = 0;
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    ball.trail.push({ x: ball.x + ball.width / 2, y: ball.y + ball.height / 2 });
    if (ball.trail.length > 12) ball.trail.shift();

    let aiTarget = ball.y + ball.height / 2 - ai.height / 2;
    const aiSpeed = ball.vx > 0 ? ai.speed : ai.speed * 0.35;
    const reactionOffset = (Math.random() - 0.5) * (30 - this.round * 4);
    aiTarget += reactionOffset;

    if (ai.y < aiTarget - 4) ai.y += aiSpeed;
    else if (ai.y > aiTarget + 4) ai.y -= aiSpeed;
    ai.y = Math.max(0, Math.min(GAME_HEIGHT - ai.height, ai.y));

    this.checkPaddleCollision(ball, player, 1);
    this.checkPaddleCollision(ball, ai, -1);

    this.updateHud();

    if (player.score >= ROUNDS[this.round]) {
      if (this.round >= ROUNDS.length - 1) {
        this.endGame(true);
      } else {
        this.advanceRound();
      }
    } else if (ai.score >= ROUNDS[this.round]) {
      this.endGame(false);
    }
  }

  private loop = (): void => {
    if (this.paused || this.over) return;
    this.update();
    this.draw();
    if (!this.over) {
      this.animationId = requestAnimationFrame(this.loop);
    }
  };

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.running && !this.over) {
      this.startGame();
      return;
    }

    if (e.keyCode === 38 || e.key === 'ArrowUp' || e.keyCode === 87) {
      this.player.move = DIRECTION.UP;
    }
    if (e.keyCode === 40 || e.key === 'ArrowDown' || e.keyCode === 83) {
      this.player.move = DIRECTION.DOWN;
    }
    if (e.key === 'p' || e.key === 'P') {
      this.togglePause();
    }
    if (e.key === 'm' || e.key === 'M') {
      this.muted = !this.muted;
      this.callbacks.onStatus(this.muted ? 'Muted' : 'Sound on');
    }
    if (e.key === 'r' || e.key === 'R') {
      if (this.over || !this.running) this.restart();
    }
  }
}
