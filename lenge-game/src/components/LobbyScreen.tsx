import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  roomId: string;
  p1name: string;
}

export function LobbyScreen({ roomId, p1name }: Props) {
  const gameUrl = `${window.location.origin}/game/${roomId}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(gameUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="screen active">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2>対戦相手を待っています</h2>
        <p className="hint">{p1name} のルームが作成されました</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <QRCodeSVG value={gameUrl} size={180} />
        <p className="sub" style={{ textAlign: 'center' }}>QRコードまたはURLを対戦相手に共有してください</p>
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <input
            readOnly
            value={gameUrl}
            style={{
              flex: 1,
              fontSize: '0.72rem',
              padding: '8px 10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
            }}
          />
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? '✓' : 'コピー'}
          </button>
        </div>
        <p className="sub">ルームID: <strong>{roomId}</strong></p>
      </div>

      <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div className="spinner" />
        <p className="sub">対戦相手の入室を待っています...</p>
      </div>
    </div>
  );
}
