import type { TurnRecord, Player } from '../types';

interface Props {
  players: [Player, Player];
  history: TurnRecord[];
  defaultOpen?: boolean;
}

export function HistoryPanel({ players, history, defaultOpen = false }: Props) {
  const running: [number, number] = [0, 0];
  const rows = history.map((r) => {
    if (r.isOut) running[r.playerIdx] = 0;
    else running[r.playerIdx] += r.scoreDelta;
    return { rec: r, total: running[r.playerIdx] };
  });

  return (
    <details className="history-panel" open={defaultOpen}>
      <summary>選択履歴（全{history.length}件）</summary>
      {history.length === 0 ? (
        <p className="history-empty">まだ記録がありません</p>
      ) : (
        <ol className="history-list">
          {rows.map(({ rec, total }, i) => (
            <li
              key={i}
              className={`history-row ${rec.isOut ? 'is-out' : 'is-safe'}`}
            >
              <span className="hp-turn">T{Math.ceil(rec.turn / 2)}</span>
              <span className="hp-name">{players[rec.playerIdx].name}</span>
              <span className="hp-pick">イス{rec.pick}</span>
              <span className="hp-mark">{rec.isOut ? '×' : '○'}</span>
              <span className="hp-delta">
                {rec.isOut ? '±0' : `+${rec.scoreDelta}`}
              </span>
              <span className="hp-total">→ {total}</span>
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}
