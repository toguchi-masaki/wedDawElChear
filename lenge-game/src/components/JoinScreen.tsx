import { useRef, useState } from 'react';
import { joinRoom } from '../lib/roomUtils';

interface Props {
  roomId: string;
  onJoined: () => void;
}

export function JoinScreen({ roomId, onJoined }: Props) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    const name = nameRef.current?.value.trim() || 'Player 2';
    setLoading(true);
    setError(null);
    try {
      await joinRoom(roomId, name);
      onJoined();
    } catch (e) {
      setError(e instanceof Error ? e.message : '参加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen active">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1>電気イスゲーム</h1>
        <p className="hint">対戦に招待されています</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p className="sub">ルームID: <strong>{roomId}</strong></p>
        <div className="field">
          <label>あなたの名前</label>
          <input ref={nameRef} type="text" defaultValue="Player 2" placeholder="Player 2" autoFocus />
        </div>
        {error && <p style={{ color: 'var(--out)', fontSize: '0.85rem' }}>{error}</p>}
      </div>

      <button
        className="btn btn-primary btn-full"
        disabled={loading}
        onClick={handleJoin}
      >
        {loading ? '参加中...' : 'ゲームに参加'}
      </button>
    </div>
  );
}
