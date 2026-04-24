import { LENGE_COUNT } from '../types';

interface Props {
  deactivated: Set<number>;
  markedOut?: Set<number>;      // setter mode: highlight as out
  markedPick?: Set<number>;     // chooser mode: highlight pending pick
  revealedPick?: number | null; // result mode: reveal this number
  revealedIsOut?: boolean;
  onPick?: (n: number) => void;
}

export function LengeGrid({
  deactivated,
  markedOut,
  markedPick,
  revealedPick,
  revealedIsOut,
  onPick,
}: Props) {
  return (
    <div className="lenge-grid">
      {Array.from({ length: LENGE_COUNT }, (_, i) => {
        const n = i + 1;
        const dead = deactivated.has(n);
        const isMarkedOut = markedOut?.has(n) ?? false;
        const isMarkedPick = markedPick?.has(n) ?? false;
        const isRevealed = revealedPick === n;

        let cls = 'lb';
        if (dead) cls += ' dead';
        else if (isRevealed) cls += revealedIsOut ? ' reveal-out' : ' reveal-safe';
        else if (isMarkedOut) cls += ' out-marked';
        else if (isMarkedPick) cls += ' pick-marked';

        return (
          <button
            key={n}
            className={cls}
            disabled={dead || !!revealedPick}
            onClick={() => !dead && onPick?.(n)}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
