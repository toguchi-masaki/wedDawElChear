import type { TurnRecord, Player } from '../types';
import { MAX_OUTS } from '../types';

const DISPLAY_MAX_TURNS = 8;

interface Props {
  players: [Player, Player];
  history: TurnRecord[];
  currentTurn: number;
  gameOver: boolean;
}

export function ScoreboardGrid({ players, history, currentTurn, gameOver }: Props) {
  const currentDisplayTurn = Math.ceil(currentTurn / 2);

  const lookup: Record<number, Record<number, TurnRecord>> = {};
  for (const r of history) {
    const dt = Math.ceil(r.turn / 2);
    if (!lookup[dt]) lookup[dt] = {};
    lookup[dt][r.playerIdx] = r;
  }

  const outDots = (count: number) =>
    Array.from({ length: MAX_OUTS }, (_, j) => (
      <span key={j} className={`dot ${j < count ? 'filled' : ''}`} />
    ));

  return (
    <table className="sgrid-table">
      <thead>
        <tr>
          <th className="sgrid-th-label" />
          {players.map((p, i) => (
            <th key={i} className="sgrid-th-player">{p.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: DISPLAY_MAX_TURNS }, (_, idx) => {
          const dt = idx + 1;
          const isCurrent = !gameOver && dt === currentDisplayTurn;
          return (
            <tr key={dt} className={isCurrent ? 'sgrid-row-current' : ''}>
              <td className="sgrid-td-label">T{dt}</td>
              {players.map((_, pi) => {
                const rec = lookup[dt]?.[pi];
                if (!rec) {
                  return <td key={pi} className="sgrid-td-empty">—</td>;
                }
                return (
                  <td key={pi} className={`sgrid-td-cell ${rec.isOut ? 'sgrid-cell-out' : 'sgrid-cell-safe'}`}>
                    <span className="sgrid-pick">{rec.pick}</span>
                    <span className="sgrid-mark">{rec.isOut ? '×' : '○'}</span>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="sgrid-foot-row">
          <td className="sgrid-td-label sgrid-foot-label">OUT</td>
          {players.map((p, i) => (
            <td key={i} className="sgrid-td-dots">
              <div className="pc-dots">{outDots(p.outCount)}</div>
            </td>
          ))}
        </tr>
        <tr className="sgrid-foot-row">
          <td className="sgrid-td-label sgrid-foot-label">PT</td>
          {players.map((p, i) => (
            <td key={i} className="sgrid-td-score">
              <span className="sgrid-score">{p.score}</span>
            </td>
          ))}
        </tr>
      </tfoot>
    </table>
  );
}
