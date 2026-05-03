import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  roomId: string;
  p1name: string;
}

function CopyableUrl({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
      <QRCodeSVG value={url} size={160} />
      <p className="sub" style={{ textAlign: 'center' }}>{label}</p>
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <input
          readOnly
          value={url}
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
    </div>
  );
}

export function LobbyScreen({ roomId, p1name }: Props) {
  const gameUrl = `${window.location.origin}/game/${roomId}`;
  const spectatorUrl = `${window.location.origin}/game/${roomId}?role=spectator`;

  return (
    <div className="screen active">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2>対戦相手を待っています</h2>
        <p className="hint">{p1name} のルームが作成されました</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <CopyableUrl url={gameUrl} label="QRコードまたはURLを対戦相手に共有してください" />
        <p className="sub">ルームID: <strong>{roomId}</strong></p>
      </div>

      <details className="card spectator-invite">
        <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
          <span className="sub">👁 観戦URLを共有する</span>
        </summary>
        <div style={{ marginTop: 16 }}>
          <CopyableUrl url={spectatorUrl} label="観戦者にこのURLまたはQRコードを共有してください" />
        </div>
      </details>

      <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div className="spinner" />
        <p className="sub">対戦相手の入室を待っています...</p>
      </div>
    </div>
  );
}
