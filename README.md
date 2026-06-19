# Pong Game

A modern, browser-based Pong game built with **React**, **TypeScript**, and **Vite**. Play against a CPU opponent across five progressively harder rounds, with responsive scaling, sound effects, and a polished arcade-style UI.

![Stack](https://img.shields.io/badge/stack-React%20%7C%20TypeScript%20%7C%20Vite-8c52ff)

---

## Features

- **Large responsive play area** — 1600×900 internal resolution, scaled to fit your screen
- **5-round campaign** — each round has a unique name, target score, and increasing difficulty
- **Angle-based ball physics** — hit location on the paddle changes ball trajectory
- **Accelerating rallies** — ball speed increases on every paddle hit (capped at 18)
- **Smart CPU opponent** — tracks the ball with reaction variance that tightens in later rounds
- **Visual effects** — glowing paddles, ball trail, particle bursts, score flashes, and grid background
- **Sound effects** — paddle hits, scoring, round transitions, and victory/defeat tones (toggle with **M**)
- **Persistent high score** — saved to `localStorage` in your browser
- **Pause & restart** — pause mid-game or restart after game over

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (includes npm)

### Install & run

```powershell
cd "c:\Users\rapha\Downloads\Java\Game 1\Pong Game"
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**).

### Other commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |

---

## Controls

| Key | Action |
|-----|--------|
| `↑` / `W` | Move paddle up |
| `↓` / `S` | Move paddle down |
| `P` | Pause / resume |
| `M` | Toggle sound |
| `R` | Restart (after game over or from menu) |
| Any key | Start game from title screen |

---

## How to Play

1. Press any key on the title screen to begin.
2. Control the **left paddle** (cyan) and rally the ball past the **CPU** (red) on the right.
3. Score a point when the ball passes your opponent's paddle.
4. Win the round by reaching the target score first.
5. Beat all **5 rounds** to win the game. Lose any round and it's game over.

### Rounds

| Round | Name | Target Score |
|-------|------|--------------|
| 1 | Warm Up | 5 |
| 2 | Rally | 5 |
| 3 | Speed Run | 3 |
| 4 | Sudden Death | 3 |
| 5 | Final Boss | 2 |

---

## Project Structure

```
Pong Game/
├── public/              # Static assets
├── src/
│   ├── components/    # React UI (Header, Footer, GameCanvas)
│   ├── game/          # Game engine, types, constants
│   ├── hooks/         # usePongGame hook
│   ├── App.tsx        # Root layout
│   ├── App.css        # Styles (same design as original)
│   └── main.tsx       # Entry point
├── index.html         # Vite HTML shell
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Technical Details

- **UI:** React 19 with TypeScript
- **Build:** Vite 6
- **Rendering:** HTML5 Canvas 2D via `PongEngine` class
- **Resolution:** Fixed logical size of 1600×900, scaled via CSS and `devicePixelRatio`
- **Audio:** Web Audio API oscillator tones
- **Storage:** High score in `localStorage` (`pongHighScore`)
- **Fonts:** Orbitron & Poppins via Google Fonts

### Customization

Edit `src/game/constants.ts` for round targets, canvas size, and round names. Paddle and ball behavior live in `src/game/PongEngine.ts`.

---

## License

MIT — feel free to use, modify, and share.
