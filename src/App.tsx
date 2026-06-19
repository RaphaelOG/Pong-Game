import './App.css';
import { Footer } from './components/Footer';
import { GameCanvas } from './components/GameCanvas';
import { Header } from './components/Header';
import { usePongGame } from './hooks/usePongGame';

export default function App() {
  const { canvasRef, hud, highScore, status, overlay } = usePongGame();

  return (
    <>
      <Header hud={hud} highScore={highScore} />
      <GameCanvas canvasRef={canvasRef} overlay={overlay} />
      <Footer status={status} />
    </>
  );
}
