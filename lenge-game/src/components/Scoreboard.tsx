import { useState } from 'react';
import type { TurnRecord, Player } from '../types';
import { MAX_OUTS, WIN_SCORE, LENGE_COUNT } from '../types';
import { ScoreboardGrid } from './ScoreboardGrid';
import { HistoryPanel } from './HistoryPanel';
import { useCountUp } from '../hooks/useCountUp';

const DISPLAY_MAX_TURNS = 8;
const NEAR_WIN = 30;

interface Props {
  players: [Player, Player];
  setterIdx: 0 | 1;
  chooserIdx: 0 | 1;
  turn: number;
  deactivated: Set<number>;
  history: TurnRecord[];
  gameOver?: boolean;
  defaultOpen?: boolean;
  showHistory?: boolean;
}

function ScoreCell({ score }: { score: number }) {
  const display = useCountUp(score);
  const near = score >= NEAR_WIN && score < WIN_SCORE;
  return (
    <td className="sb-score-cell">
      <span className={`sb-score ${near ? 'sb-score-near' : ''}`}>{display}</span>
      <div className="sb-bar-wrap">
        <div
          className={`sb-bar ${near ? 'sb-bar-near' : ''}`}
          style={{ width: `${Math.min(100, (score / WIN_SCORE) * 100)}%` }}
        />
      </div>
      {near && <span className="sb-near-tag">あと{WIN_SCORE - score}点</span>}
    </td>
  );
}

export function Scoreboard({ players, setterIdx, chooserIdx, turn, deactivated, history, gameOver = false, defaultOpen = false, showHistory = true }: Props) {
  const remainingSum = Array.from({ length: LENGE_COUNT }, (_, i) => i + 1)
    .filter((i) => !deactivated.has(i))
    .reduce((a, b) => a + b, 0);

  const displayTurn = Math.ceil(turn / 2);
  const [open, setOpen] = useState(gameOver || defaultOpen);

  const outDots = (count: number) =>
    Array.from({ length: MAX_OUTS }, (_, j) => (
      <span key={j} className={`dot ${j < count ? 'filled' : ''}`} />
    ));

  return (
    <div className="scoreboard-wrap">
      <button
        className="sb-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="sb-toggle-summary">
          <span className="sb-toggle-name">{players[0].name}</span>
          <span className="sb-toggle-score">{players[0].score}</span>
          <span className="sb-toggle-vs">vs</span>
          <span className="sb-toggle-score">{players[1].score}</span>
          <span className="sb-toggle-name">{players[1].name}</span>
        </span>
        <span className="sb-toggle-meta">{displayTurn}/{DISPLAY_MAX_TURNS}</span>
        <span className={`sb-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
      <>
      <table className="scoreboard-table">
        <thead>
          <tr>
            <th className="sb-label-col"></th>
            {players.map((p, i) => (
              <th key={i} className={i === chooserIdx ? 'sb-chooser' : i === setterIdx ? 'sb-setter' : ''}>
                <div className="sb-name">{p.name}</div>
                <div>
                  {i === chooserIdx && <span className="badge badge-chooser">選択</span>}
                  {i === setterIdx && <span className="badge badge-setter">仕掛け</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="sb-label">スコア</td>
            {players.map((p, i) => (
              <ScoreCell key={i} score={p.score} />
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
        </tbody>
      </table>
      <div className="sb-section-divider" />
      <div className="sgrid-wrap">
        <ScoreboardGrid
          players={players}
          history={history}
          currentTurn={turn}
          gameOver={gameOver}
        />
      </div>
      {showHistory && (
        <>
          <div className="sb-section-divider" />
          <HistoryPanel players={players} history={history} defaultOpen={gameOver} />
        </>
      )}
      </>
      )}
    </div>
  );
}
