import { useGameState } from './useGameState';
import { StartScreen } from './components/StartScreen';
import { PrivateHandoff } from './components/PrivateHandoff';
import { SetterSetupScreen } from './components/SetterSetupScreen';
import { ChooserPickScreen } from './components/ChooserPickScreen';
import { ResultScreen } from './components/ResultScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { Scoreboard } from './components/Scoreboard';

export default function App() {
  const { state, dispatch } = useGameState();
  const setter = state.players[state.setterIdx];
  const chooser = state.players[state.chooserIdx];
  const inGame = state.phase !== 'START';

  const handleAbort = () => {
    if (window.confirm('ゲームを中断してスタート画面に戻りますか？')) {
      dispatch({ type: 'ABORT' });
    }
  };

  return (
    <main>
      {inGame && (
        <div className="game-header">
          <button className="btn btn-abort" onClick={handleAbort}>中断</button>
        </div>
      )}

      {inGame && (
        <Scoreboard
          players={state.players}
          setterIdx={state.setterIdx}
          chooserIdx={state.chooserIdx}
          turn={state.turn}
          deactivated={state.deactivated}
          history={state.history}
        />
      )}

      {state.phase === 'START' && (
        <StartScreen
          onStart={(p1, p2) => dispatch({ type: 'START_GAME', p1name: p1, p2name: p2 })}
        />
      )}

      {state.phase === 'SETTER_PRIVATE' && (
        <div className="screen active">
          <PrivateHandoff
            role="setter"
            playerName={setter.name}
            onReady={() => dispatch({ type: 'SHOW_SETTER_SETUP' })}
          />
        </div>
      )}

      {state.phase === 'SETTER_SETUP' && (
        <SetterSetupScreen
          state={state}
          onToggleOut={(n) => dispatch({ type: 'SELECT_OUT', n })}
          onDone={() => dispatch({ type: 'SETTER_DONE' })}
        />
      )}

      {state.phase === 'CHOOSER_PRIVATE' && (
        <div className="screen active">
          <PrivateHandoff
            role="chooser"
            playerName={chooser.name}
            onReady={() => dispatch({ type: 'SHOW_CHOOSER_PICK' })}
          />
        </div>
      )}

      {state.phase === 'CHOOSER_PICK' && (
        <ChooserPickScreen
          state={state}
          onChoose={(n) => dispatch({ type: 'CHOOSE', n })}
        />
      )}

      {state.phase === 'RESULT' && (
        <ResultScreen
          state={state}
          onContinue={() => dispatch({ type: 'CONTINUE' })}
        />
      )}

      {state.phase === 'GAME_OVER' && (
        <GameOverScreen
          state={state}
          onReset={() => dispatch({ type: 'RESET' })}
        />
      )}
    </main>
  );
}
