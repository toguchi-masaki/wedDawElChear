import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRoom } from './hooks/useRoom';
import { StartScreen } from './components/StartScreen';
import { JoinScreen } from './components/JoinScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { WaitingScreen } from './components/WaitingScreen';
import { SetterSetupScreen } from './components/SetterSetupScreen';
import { ChooserPickScreen } from './components/ChooserPickScreen';
import { ResultScreen } from './components/ResultScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { Scoreboard } from './components/Scoreboard';
import { SpectatorScreen } from './components/SpectatorScreen';
import { WaitingLobbyScreen } from './components/WaitingLobbyScreen';

function GameRoomRoute() {
  const [searchParams] = useSearchParams();
  if (searchParams.get('role') === 'spectator') return <SpectatorScreen />;
  return <GameRoom />;
}

function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameState, dispatch, updatePendingPick, resync, myIdx, isLoading, error, opponentConnected, disconnected } = useRoom(roomId!);

  const { phase, players, setterIdx, chooserIdx } = gameState;
  const inGame = phase !== 'LOBBY' && phase !== 'WAITING_LOBBY';

  const [reconnectToast, setReconnectToast] = useState(false);
  const prevOpponentRef = useRef(opponentConnected);
  useEffect(() => {
    const prev = prevOpponentRef.current;
    prevOpponentRef.current = opponentConnected;
    if (!prev && opponentConnected) {
      setReconnectToast(true);
      const t = setTimeout(() => setReconnectToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [opponentConnected]);

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

  if (myIdx === null) {
    return (
      <main>
        <JoinScreen roomId={roomId!} onJoined={() => window.location.reload()} />
      </main>
    );
  }

  const amISetter = myIdx === setterIdx;
  const amIChooser = myIdx === chooserIdx;

  const handleAbort = () => {
    if (window.confirm('ゲームを中断してトップへ戻りますか？')) {
      dispatch({ type: 'ABORT' });
      navigate('/');
    }
  };

  return (
    <main>
      {disconnected && (
        <div className="reconnect-overlay">
          <div className="reconnect-card">
            <div className="spinner" />
            <h2>接続が切れました</h2>
            <p className="hint">サーバーへの再接続を試みています...</p>
            <button className="btn btn-primary btn-full" onClick={resync}>
              再同期する
            </button>
          </div>
        </div>
      )}

      {inGame && !opponentConnected && (
        <div className="disconnect-banner">
          <span>⚠ 相手の接続が切断されました</span>
        </div>
      )}

      {inGame && opponentConnected && reconnectToast && (
        <div className="reconnect-banner">
          <span>✓ 相手が再接続しました</span>
        </div>
      )}

      {inGame && phase !== 'GAME_OVER' && (
        <div className="game-header">
          <button className="btn btn-abort" onClick={handleAbort}>中断</button>
        </div>
      )}

      {inGame && (
        <Scoreboard
          players={players}
          setterIdx={setterIdx}
          chooserIdx={chooserIdx}
          turn={gameState.turn}
          deactivated={gameState.deactivated}
          history={gameState.history}
          gameOver={gameState.gameOver}
        />
      )}

      {phase === 'LOBBY' && (
        <LobbyScreen roomId={roomId!} p1name={players[0].name} />
      )}

      {phase === 'WAITING_LOBBY' && (
        <WaitingLobbyScreen
          players={players}
          readyFlags={gameState.readyFlags}
          myIdx={myIdx}
          onReady={() => dispatch({ type: 'PLAYER_READY', playerIdx: myIdx })}
        />
      )}

      {phase === 'SETTER_SETUP' && amISetter && (
        <SetterSetupScreen
          state={gameState}
          onToggleOut={(n) => dispatch({ type: 'SELECT_OUT', n })}
          onDone={() => dispatch({ type: 'SETTER_DONE' })}
        />
      )}

      {phase === 'SETTER_SETUP' && !amISetter && (
        <WaitingScreen
          message="相手がアウト番号を設定中..."
          playerName={players[myIdx].name}
          timerEnabled={gameState.timerEnabled}
          timerStartedAt={gameState.timerStartedAt}
          timerSeconds={gameState.timerSeconds}
        />
      )}

      {phase === 'CHOOSER_PICK' && amIChooser && (
        <ChooserPickScreen
          state={gameState}
          onChoose={(n) => dispatch({ type: 'CHOOSE', n })}
          onPendingPickChange={updatePendingPick}
        />
      )}

      {phase === 'CHOOSER_PICK' && !amIChooser && (
        <WaitingScreen
          message="相手がイスを選択中..."
          playerName={players[myIdx].name}
          timerEnabled={gameState.timerEnabled}
          timerStartedAt={gameState.timerStartedAt}
          timerSeconds={gameState.timerSeconds}
          pendingPick={gameState.pendingPick}
        />
      )}

      {phase === 'RESULT' && (
        <ResultScreen
          state={gameState}
          onContinue={() => dispatch({ type: 'CONTINUE' })}
        />
      )}

      {phase === 'GAME_OVER' && gameState.aborted && (
        <div className="screen active" style={{ gap: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>🚪</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2>ゲームが中断されました</h2>
            <p style={{ color: 'var(--text-soft)', fontSize: '.9rem' }}>
              相手プレイヤーがゲームを中断しました
            </p>
          </div>
          <button className="btn btn-primary btn-full" onClick={() => navigate('/')}>
            トップへ戻る
          </button>
        </div>
      )}

      {phase === 'GAME_OVER' && !gameState.aborted && (
        <GameOverScreen
          state={gameState}
          onReset={() => navigate('/')}
        />
      )}
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<main><StartScreen /></main>} />
        <Route path="/game/:roomId" element={<GameRoomRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
