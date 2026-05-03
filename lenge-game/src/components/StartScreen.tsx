import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../lib/roomUtils';

const TIMER_OPTIONS = [10, 20, 30, 60];

export function StartScreen() {
  const nameRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const navigate = useNavigate();

  const handleCreate = async () => {
    const name = nameRef.current?.value.trim() || 'Player 1';
    setLoading(true);
    setError(null);
    try {
      const roomId = await createRoom(name, timerEnabled, timerSeconds);
      navigate(`/game/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ルームの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen active">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1>電気イスゲーム</h1>
        <p className="hint">2人用 戦略対戦ゲーム</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label>あなたの名前</label>
          <input ref={nameRef} type="text" defaultValue="Player 1" placeholder="Player 1" autoFocus />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={timerEnabled}
              onChange={(e) => setTimerEnabled(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span className="sub">⏱ 思考時間制限</span>
          </label>

          {timerEnabled && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TIMER_OPTIONS.map((s) => (
                <button
                  key={s}
                  className={`btn ${timerSeconds === s ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, minWidth: 48 }}
                  onClick={() => setTimerSeconds(s)}
                >
                  {s}秒
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p style={{ color: 'var(--out)', fontSize: '0.85rem' }}>{error}</p>}
      </div>

      <div className="card">
        <p className="sub">
          <strong style={{ color: 'var(--text)', fontSize: '.9rem', letterSpacing: '-0.01em' }}>ゲームルール</strong>
        </p>
        <div className="rules-divider" style={{ margin: '10px 0 14px' }} />
        <p className="sub">
          🔄&ensp;毎ターン、<strong style={{ color: 'var(--text)' }}>攻撃側</strong>と<strong style={{ color: 'var(--text)' }}>守備側</strong>を交代しながら進行<br />
          🔒&ensp;攻撃側：1〜12 のイスから <strong style={{ color: 'var(--text)' }}>1つだけ</strong> アウトを設定<br />
          🎲&ensp;守備側：アクティブなイスから1つ選ぶ<br />
        </p>
        <div className="rules-divider" style={{ margin: '12px 0' }} />
        <p className="sub">
          ✅&ensp;セーフ → <strong style={{ color: 'var(--success)' }}>選んだ数字分スコア加算</strong>、番号は使用済みに<br />
          💥&ensp;アウト → <strong style={{ color: 'var(--out)' }}>スコアリセット（0）</strong> ＋ アウトカウント +1<br />
        </p>
        <div className="rules-divider" style={{ margin: '12px 0' }} />
        <p className="sub">
          🏆&ensp;スコア <strong style={{ color: 'var(--warning)' }}>40以上</strong> → 即時勝利<br />
          💀&ensp;アウト <strong style={{ color: 'var(--out)' }}>3回</strong> → 敗北<br />
          ⏱️&ensp;<strong style={{ color: 'var(--text)' }}>8ターン</strong> 終了時にスコアが低い方が敗北<br />
          📉&ensp;残りイスを全取りしても逆転不可 → 敗北確定
        </p>
      </div>

      <button
        className="btn btn-primary btn-full"
        disabled={loading}
        onClick={handleCreate}
      >
        {loading ? 'ルームを作成中...' : 'ゲームを作成'}
      </button>
    </div>
  );
}
