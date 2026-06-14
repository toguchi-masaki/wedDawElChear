import { useParams, useNavigate } from 'react-router-dom';
import { useSpectatorRoom } from '../hooks/useSpectatorRoom';
import { Scoreboard } from './Scoreboard';
import { LengeGrid } from './LengeGrid';
import { CountdownTimer } from './CountdownTimer';
import { ResultFlash } from './ResultFlash';
import { Confetti } from './Confetti';

const PHASE_LABELS: Record<string, string> = {
  LOBBY: '対戦開始待ち',
  SETTER_SETUP: '攻撃側がアウト番号を設定中...',
  CHOOSER_PICK: '守備側がイスを選択中...',
  RESULT: '結果発表',
  GAME_OVER: 'ゲーム終了',
};

export function SpectatorScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameState, spectatorCount, isLoading, error } = useSpectatorRoom(roomId!);

  if (isLoading) {
    return (
      <main>
        <div className="screen active" style={{ justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <div className="spinner" />
          <p className="hint">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <div className="screen active" style={{ justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <p style={{ color: 'var(--out)' }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>トップへ戻る</button>
        </div>
      </main>
    );
  }

  const { phase, players, setterIdx, chooserIdx, deactivated, history, lastPick, lastIsOut, winnerIdx, winReason, gameOver } = gameState;
  const inGame = phase !== 'LOBBY';

  return (
    <main className="spectator-main">
      {phase === 'RESULT' && <ResultFlash isOut={lastIsOut} triggerKey={gameState.turn} />}

      <div className="game-header">
        <span className="spectator-badge">👁 観戦中</span>
        {spectatorCount > 0 && (
          <span className="spectator-count">{spectatorCount}人が観戦中</span>
        )}
        <button
          className="btn btn-abort"
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            if (window.confirm('観戦を終了しますか？')) navigate('/');
          }}
        >
          観戦を終了
        </button>
      </div>

      {phase === 'LOBBY' && (
        <div className="screen active">
          <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="sub">対戦がまだ始まっていません</p>
            <div className="spinner" />
            <p className="hint">対戦開始をお待ちください</p>
          </div>
        </div>
      )}

      {inGame && (
        <div className="spectator-layout">
          <div className="spectator-col-board">
            {phase !== 'GAME_OVER' && (
              <>
                <div className="spectator-phase-banner">
                  <span>{PHASE_LABELS[phase] ?? phase}</span>
                </div>

                {gameState.timerEnabled && gameState.timerStartedAt && (phase === 'SETTER_SETUP' || phase === 'CHOOSER_PICK') && (
                  <CountdownTimer
                    timerStartedAt={gameState.timerStartedAt}
                    timerSeconds={gameState.timerSeconds}
                  />
                )}

                <LengeGrid
                  deactivated={deactivated}
                  markedOut={phase === 'CHOOSER_PICK' ? gameState.outNumbers : undefined}
                  markedPick={phase === 'CHOOSER_PICK' && gameState.pendingPick != null ? new Set([gameState.pendingPick]) : undefined}
                  revealedPick={phase === 'RESULT' ? lastPick : null}
                  revealedIsOut={phase === 'RESULT' ? lastIsOut : false}
                />
              </>
            )}

            {phase === 'GAME_OVER' && (
              <div className="card spectator-gameover" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {winnerIdx !== -1 && <Confetti />}
                <div className="trophy" style={{ fontSize: '4rem' }}>🏆</div>
                <h2>ゲーム終了</h2>
                {winnerIdx === -1 ? (
                  <p className="sub">引き分け</p>
                ) : (
                  <>
                    <p className="sub">
                      <strong style={{ color: 'var(--accent)' }}>{players[winnerIdx].name}</strong> の勝利！
                    </p>
                    <p className="hint">{winReason}</p>
                  </>
                )}
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 24 }}>
                  {players.map((p, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div className="sub">{p.name}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{p.score}</div>
                      <div className="hint">アウト {p.outCount}回</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="spectator-col-info">
            <Scoreboard
              players={players}
              setterIdx={setterIdx}
              chooserIdx={chooserIdx}
              turn={gameState.turn}
              deactivated={deactivated}
              history={history}
              gameOver={gameOver}
            />
          </div>
        </div>
      )}
    </main>
  );
}
