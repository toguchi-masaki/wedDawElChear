interface Props {
  role: 'setter' | 'chooser';
  playerName: string;
  onReady: () => void;
}

const config = {
  setter:  { icon: '⚡', label: '仕掛け側', color: 'var(--accent)', glow: 'rgba(79, 158, 255, 0.5)' },
  chooser: { icon: '🪑', label: '選択側', color: 'var(--purple)', glow: 'rgba(192, 132, 252, 0.5)' },
};

export function PrivateHandoff({ role, playerName, onReady }: Props) {
  const { icon, label, glow } = config[role];
  return (
    <div className="card priv">
      <div className="icon" style={{ filter: `drop-shadow(0 0 24px ${glow})` }}>{icon}</div>
      <h2>{playerName}
        <span style={{ color: 'var(--text-soft)', fontWeight: 400 }}>（{label}）</span>
      </h2>
      <p>デバイスを {label} に渡してください</p>
      <button className="btn btn-primary" onClick={onReady}>
        {label}準備完了
      </button>
    </div>
  );
}
