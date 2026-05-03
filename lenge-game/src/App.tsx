import { useState, useEffect } from 'react';
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

const AUTO_SURRENDER_DELAY = 30;

function GameRoomRoute() {
  const [searchParams] = useSearchParams();
  if (searchParams.get('role') === 'spectator') return <SpectatorScreen />;
  return <GameRoom />;
}

function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameState, dispatch, myIdx, isLoading, error, opponentConnected, disconnectedAt } = useRoom(roomId!);
  const [surrenderCountdown, setSurrenderCountdown] = useState<number | null>(null);

  const { phase, players, setterIdx, chooserIdx } = gameState;
  const inGame = phase !== 'LOBBY' && phase !== 'WAITING_LOBBY';

  // 自動降参カウントダウン
  useEffect(() => {
    if (!disconnectedAt || !inGame || gameState.gameOver || myIdx === null) {
      setSurrenderCountdown(null);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - disconnectedAt) / 1000);
      const remaining = AUTO_SURRENDER_DELAY - elapsed;
      if (remaining <= 0) {
        setSurrenderCountdown(0);
        const opponentIdx = myIdx === 0 ? 1 : 0;
        dispatch({ type: 'SURRENDER', surrendererIdx: opponentIdx });
      } else {
        setSurrenderCountdown(remaining);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [disconnectedAt, inGame, gameState.gameOver, myIdx, dispatch]);

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
      navigate('/');
    }
  };

  const handleSurrender = () => {
    if (window.confirm('本当に降参しますか？')) {
      dispatch({ type: 'SURRENDER', surrendererIdx: myIdx });
    }
  };

  return (
    <main>
      {inGame && !opponentConnected && (
        <div className="disconnect-banner">
          <span>⚠ 相手の接続が切断されました</span>
          {surrenderCountdown !== null && surrenderCountdown > 0 && (
            <span className="disconnect-countdown">{surrenderCountdown}秒後に自動降参</span>
          )}
        </div>
      )}

      {inGame && phase !== 'GAME_OVER' && (
        <div className="game-header">
          <button className="btn btn-surrender" onClick={handleSurrender}>降参</button>
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
        />
      )}

      {phase === 'CHOOSER_PICK' && !amIChooser && (
        <WaitingScreen
          message="相手がイスを選択中..."
          playerName={players[myIdx].name}
          timerEnabled={gameState.timerEnabled}
          timerStartedAt={gameState.timerStartedAt}
          timerSeconds={gameState.timerSeconds}
        />
      )}

      {phase === 'RESULT' && (
        <ResultScreen
          state={gameState}
          onContinue={() => dispatch({ type: 'CONTINUE' })}
        />
      )}

      {phase === 'GAME_OVER' && (
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
