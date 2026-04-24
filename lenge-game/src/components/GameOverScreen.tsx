import type { GameState } from '../types';

interface Props {
  state: GameState;
  onReset: () => void;
}

export function GameOverScreen({ state, onReset }: Props) {
  const winner = state.winnerIdx !== -1 ? state.players[state.winnerIdx] : null;
  const loser = state.winnerIdx !== -1 ? state.players[state.winnerIdx === 0 ? 1 : 0] : null;

  return (
    <div className="screen active" style={{ gap: 24 }}>
      <div className="trophy">🏆</div>

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="winner-name">
          {winner ? `${winner.name} の勝利！` : '引き分け！'}
        </div>
        <p style={{ color: 'var(--text-soft)', fontSize: '.9rem' }}>{state.winReason}</p>
      </div>

      {winner && loser && (
        <div className="card" style={{ display: 'flex', gap: 0, padding: 0, overflow: 'hidden' }}>
          {[winner, loser].map((p, i) => (
            <div key={p.name} style={{
              flex: 1,
              padding: '18px 16px',
              textAlign: 'center',
              borderRight: i === 0 ? '1px solid var(--border)' : 'none',
              background: i === 0 ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
            }}>
              <div style={{
                fontSize: '.7rem',
                fontWeight: 700,
                letterSpacing: '.08em',
                color: i === 0 ? 'var(--warning)' : 'var(--dim)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}>
                {i === 0 ? '🏆 勝者' : '敗者'}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>{p.name}</div>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: i === 0 ? 'var(--warning)' : 'var(--dim)',
              }}>{p.score}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--dim)', marginTop: 2 }}>点</div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary btn-full" onClick={onReset}>
        もう一度プレイ
      </button>
    </div>
  );
}
