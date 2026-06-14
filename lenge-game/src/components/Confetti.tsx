import type { CSSProperties } from 'react';

const COLORS = ['#4f9eff', '#c084fc', '#34d399', '#fbbf24', '#f87171'];
const PIECES = 60;

export function Confetti() {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: PIECES }, (_, i) => {
        const left = (i * 97) % 100;
        const delay = (i % 10) * 0.12;
        const duration = 2.4 + ((i * 7) % 18) / 10;
        const color = COLORS[i % COLORS.length];
        const drift = ((i * 53) % 120) - 60;
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              background: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              '--drift': `${drift}px`,
            } as CSSProperties}
          />
        );
      })}
    </div>
  );
}
