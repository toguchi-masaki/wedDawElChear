import type { TurnRecord, Player } from '../types';
import { MAX_OUTS, WIN_SCORE, LENGE_COUNT } from '../types';

const DISPLAY_MAX_TURNS = 8; // 先攻後攻1セット = 1ターン

interface Props {
  players: [Player, Player];
  setterIdx: 0 | 1;
  chooserIdx: 0 | 1;
  turn: number;
  deactivated: Set<number>;
  history: TurnRecord[];
}

export function Scoreboard({ players, setterIdx, chooserIdx, turn, deactivated, history }: Props) {
  const remainingSum = Array.from({ length: LENGE_COUNT }, (_, i) => i + 1)
    .filter((i) => !deactivated.has(i))
    .reduce((a, b) => a + b, 0);

  const displayTurn = Math.ceil(turn / 2);

  const outDots = (count: number) =>
    Array.from({ length: MAX_OUTS }, (_, j) => (
      <span key={j} className={`dot ${j < count ? 'filled' : ''}`} />
    ));

  return (
    <div className="scoreboard-wrap">
      <table className="scoreboard-table">
        <thead>
          <tr>
            <th className="sb-label-col"></th>
            {players.map((p, i) => (
              <th key={i} className={i === chooserIdx ? 'sb-chooser' : i === setterIdx ? 'sb-setter' : ''}>
                <div className="sb-name">{p.name}</div>
                <div>
                  {i === chooserIdx && <span className="badge badge-chooser">守備</span>}
                  {i === setterIdx && <span className="badge badge-setter">攻撃</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="sb-label">スコア</td>
            {players.map((p, i) => (
              <td key={i} className="sb-score-cell">
                <span className="sb-score">{p.score}</span>
                <div className="sb-bar-wrap">
                  <div className="sb-bar" style={{ width: `${Math.min(100, (p.score / WIN_SCORE) * 100)}%` }} />
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <td className="sb-label">アウト</td>
            {players.map((p, i) => (
              <td key={i} className="sb-dots-cell">
                <div className="pc-dots">{outDots(p.outCount)}</div>
              </td>
            ))}
          </tr>
          <tr>
            <td className="sb-label">ターン</td>
            <td colSpan={2} className="sb-meta-cell">
              {displayTurn} / {DISPLAY_MAX_TURNS}　残りイス合計: {remainingSum}
            </td>
          </tr>
          {history.length > 0 && (
            <tr>
              <td className="sb-label">履歴</td>
              {players.map((_, i) => {
                const rows = history.filter((r) => r.playerIdx === i);
                return (
                  <td key={i} className="sb-history-cell">
                    {rows.length === 0 ? (
                      <span className="sb-no-history">—</span>
                    ) : (
                      rows.map((r) => (
                        <div key={r.turn} className="sb-hist-row">
                          <span className="sh-turn">T{Math.ceil(r.turn / 2)}</span>
                          <span className="sh-pick">{r.pick}</span>
                          <span className="sh-icon">{r.isOut ? '💥' : '✅'}</span>
                          <span className="sh-delta">{r.isOut ? '±0' : `+${r.scoreDelta}`}</span>
                        </div>
                      ))
                    )}
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
