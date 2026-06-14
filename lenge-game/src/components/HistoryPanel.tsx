import type { TurnRecord, Player } from '../types';

interface Props {
  players: [Player, Player];
  history: TurnRecord[];
  defaultOpen?: boolean;
}

export function HistoryPanel({ players, history, defaultOpen = false }: Props) {
  return (
    <details className="history-panel" open={defaultOpen}>
      <summary>仕掛け履歴（全{history.length}件）</summary>
      {history.length === 0 ? (
        <p className="history-empty">まだ記録がありません</p>
      ) : (
        <ol className="history-list">
          {history.map((rec, i) => {
            const setterIdx = rec.playerIdx === 0 ? 1 : 0;
            return (
              <li
                key={i}
                className={`history-row ${rec.isOut ? 'is-out' : 'is-safe'}`}
              >
                <span className="hp-turn">T{Math.ceil(rec.turn / 2)}</span>
                <span className="hp-name">{players[setterIdx].name}</span>
                <span className="hp-pick">イス{(rec.outNumbers ?? []).join('・')}</span>
                <span className="hp-mark">{rec.isOut ? '命中' : '回避'}</span>
              </li>
            );
          })}
        </ol>
      )}
    </details>
  );
}
