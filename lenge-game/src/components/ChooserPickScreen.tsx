import { useState } from 'react';
import type { GameState } from '../types';
import { LengeGrid } from './LengeGrid';

interface Props {
  state: GameState;
  onChoose: (n: number) => void;
}

export function ChooserPickScreen({ state, onChoose }: Props) {
  const defender = state.players[state.chooserIdx];
  const [pending, setPending] = useState<number | null>(null);

  const handlePick = (n: number) => {
    setPending((prev) => (prev === n ? null : n));
  };

  const handleConfirm = () => {
    if (pending == null) return;
    onChoose(pending);
    setPending(null);
  };

  const markedSet = pending != null ? new Set([pending]) : new Set<number>();

  return (
    <div className="screen active">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="badge badge-chooser">守備</span>
        <h2 style={{ marginTop: 4 }}>{defender.name}</h2>
      </div>

      <div className="card">
        <p className="sub" style={{ marginBottom: 16 }}>
          イスを <strong style={{ color: 'var(--text)' }}>1つ</strong> 選んでください
        </p>
        <LengeGrid
          deactivated={state.deactivated}
          markedPick={markedSet}
          onPick={handlePick}
        />
        <div className="out-tally">
          {pending == null ? '未選択' : <>選択中: <strong>イス {pending}</strong></>}
        </div>
      </div>

      <button
        className="btn btn-success btn-full"
        disabled={pending == null}
        onClick={handleConfirm}
      >
        選択確定
      </button>
    </div>
  );
}
