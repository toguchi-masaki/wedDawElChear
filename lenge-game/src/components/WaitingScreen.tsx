interface Props {
  message: string;
  playerName: string;
}

export function WaitingScreen({ message, playerName }: Props) {
  return (
    <div className="screen active">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2>{playerName}</h2>
      </div>

      <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="spinner" />
        <p className="sub">{message}</p>
      </div>
    </div>
  );
}
