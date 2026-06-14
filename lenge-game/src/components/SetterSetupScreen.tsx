import { useCallback } from 'react';
import type { GameState } from '../types';
import { LENGE_COUNT } from '../types';
import { LengeGrid } from './LengeGrid';
import { CountdownTimer } from './CountdownTimer';

interface Props {
  state: GameState;
  onToggleOut: (n: number) => void;
  onDone: () => void;
}

export function SetterSetupScreen({ state, onToggleOut, onDone }: Props) {
  const attacker = state.players[state.setterIdx];

  const handleExpire = useCallback(() => {
    const active = Array.from({ length: LENGE_COUNT }, (_, i) => i + 1)
      .filter((n) => !state.deactivated.has(n));
    if (active.length === 0) return;
    const pick = state.outNumbers.size > 0
      ? [...state.outNumbers][0]
      : active[Math.floor(Math.random() * active.length)];
    if (!state.outNumbers.has(pick)) onToggleOut(pick);
    onDone();
  }, [state.deactivated, state.outNumbers, onToggleOut, onDone]);

  return (
    <div className="screen active">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="badge badge-setter">仕掛け</span>
        <h2 style={{ marginTop: 4 }}>{attacker.name}</h2>
      </div>

      {state.timerEnabled && state.timerStartedAt && (
        <CountdownTimer
          timerStartedAt={state.timerStartedAt}
          timerSeconds={state.timerSeconds}
          onExpire={handleExpire}
        />
      )}

      <div className="card">
        <p className="sub" style={{ marginBottom: 16 }}>
          アウトにするイスを <strong style={{ color: 'var(--text)' }}>1つだけ</strong> 選んでください
        </p>
        <LengeGrid
          deactivated={state.deactivated}
          markedOut={state.outNumbers}
          onPick={onToggleOut}
        />
        <div className="out-tally">
          {state.outNumbers.size === 0
            ? '未選択'
            : <>アウト設定: <strong>イス {[...state.outNumbers][0]}</strong></>}
        </div>
      </div>

      <button
        className="btn btn-success btn-full"
        disabled={state.outNumbers.size === 0}
        onClick={onDone}
      >
        設定完了
      </button>
    </div>
  );
}
