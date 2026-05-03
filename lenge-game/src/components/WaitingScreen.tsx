import { CountdownTimer } from './CountdownTimer';

interface Props {
  message: string;
  playerName: string;
  timerEnabled?: boolean;
  timerStartedAt?: string | null;
  timerSeconds?: number;
}

export function WaitingScreen({ message, playerName, timerEnabled, timerStartedAt, timerSeconds }: Props) {
  return (
    <div className="screen active">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2>{playerName}</h2>
      </div>

      {timerEnabled && timerStartedAt && timerSeconds && (
        <CountdownTimer
          timerStartedAt={timerStartedAt}
          timerSeconds={timerSeconds}
        />
      )}

      <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="spinner" />
        <p className="sub">{message}</p>
      </div>
    </div>
  );
}
