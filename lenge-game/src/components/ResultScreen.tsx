import type { GameState } from '../types';
import { MAX_OUTS } from '../types';

interface Props {
  state: GameState;
  onContinue: () => void;
}

export function ResultScreen({ state, onContinue }: Props) {
  const { lastPick, lastIsOut, gameOver, players, chooserIdx } = state;
  const defender = players[chooserIdx];
  const nextAttacker = players[chooserIdx].name;

  const continueLabel = gameOver
    ? '結果を見る →'
    : `次のターンへ（次の攻撃側: ${nextAttacker}）`;

  return (
    <div className="screen active">
      <div className={`result-banner ${lastIsOut ? 'out' : 'safe'}`}>
        <div className="ri">{lastIsOut ? '💥' : '✅'}</div>
        <div className="rt">
          {lastIsOut ? 'アウト！' : `セーフ！ +${lastPick} 点`}
        </div>
        <div className="rd">
          {lastIsOut ? (
            <>
              イス<strong>{lastPick}</strong> はアウトでした<br />
              スコアが <strong>0</strong> にリセットされました<br />
              アウト: {defender.outCount} / {MAX_OUTS}
            </>
          ) : (
            <>
              イス<strong>{lastPick}</strong> を獲得<br />
              現在のスコア: <strong>{defender.score}</strong> 点 / 目標 40 点
            </>
          )}
        </div>
      </div>

      <button className="btn btn-primary btn-full" onClick={onContinue}>
        {continueLabel}
      </button>
    </div>
  );
}
