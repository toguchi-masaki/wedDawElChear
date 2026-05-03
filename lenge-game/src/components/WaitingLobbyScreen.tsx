import type { Player } from '../types';

interface Props {
  players: [Player, Player];
  readyFlags: [boolean, boolean];
  myIdx: 0 | 1;
  onReady: () => void;
}

export function WaitingLobbyScreen({ players, readyFlags, myIdx, onReady }: Props) {
  const myReady = readyFlags[myIdx];

  return (
    <div className="screen active">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2>準備中</h2>
        <p className="hint">両プレイヤーが準備完了になるとゲームが始まります</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {([0, 1] as const).map((idx) => {
          const player = players[idx];
          const ready = readyFlags[idx];
          const isMe = idx === myIdx;
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                background: ready ? 'rgba(34,197,94,0.12)' : 'var(--bg-card)',
                border: `1px solid ${ready ? 'var(--safe)' : 'var(--border)'}`,
                transition: 'all 0.3s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {player.name || (idx === 0 ? 'Player 1' : 'Player 2')}
                </span>
                {isMe && (
                  <span className="sub" style={{ fontSize: '0.72rem' }}>（あなた）</span>
                )}
              </div>
              <span style={{ fontSize: '1.3rem' }}>
                {ready ? '✅' : <span className="spinner" style={{ width: 18, height: 18 }} />}
              </span>
            </div>
          );
        })}
      </div>

      {!myReady ? (
        <button className="btn btn-primary" onClick={onReady}>
          準備完了
        </button>
      ) : (
        <p className="hint" style={{ textAlign: 'center' }}>相手の準備を待っています...</p>
      )}
    </div>
  );
}
