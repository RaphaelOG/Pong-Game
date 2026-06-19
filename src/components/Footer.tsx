interface FooterProps {
  status: string;
}

export function Footer({ status }: FooterProps) {
  return (
    <footer>
      <div className="controls">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> or <kbd>W</kbd> <kbd>S</kbd> — Move paddle
        </span>
        <span>
          <kbd>P</kbd> — Pause
        </span>
        <span>
          <kbd>M</kbd> — Mute
        </span>
        <span>
          <kbd>R</kbd> — Restart
        </span>
      </div>
      <div className="status-bar">
        <span className="status-text">{status}</span>
      </div>
    </footer>
  );
}
