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

function GameRoomRoute() {
  const [searchParams] = useSearchParams();
  if (searchParams.get('role') === 'spectator') return <SpectatorScreen />;
  return <GameRoom />;
}

function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameState, dispatch, myIdx, isLoading, error } = useRoom(roomId!);

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

  const { phase, players, setterIdx, chooserIdx } = gameState;
  const amISetter = myIdx === setterIdx;
  const amIChooser = myIdx === chooserIdx;
  const inGame = phase !== 'LOBBY';

  const handleAbort = () => {
    if (window.confirm('ゲームを中断してトップへ戻りますか？')) {
      navigate('/');
    }
  };

  return (
    <main>
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
        />
      )}

      {phase === 'LOBBY' && (
        <LobbyScreen roomId={roomId!} p1name={players[0].name} />
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
