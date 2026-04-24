import { useRef } from 'react';

interface Props {
  onStart: (p1: string, p2: string) => void;
}

export function StartScreen({ onStart }: Props) {
  const p1Ref = useRef<HTMLInputElement>(null);
  const p2Ref = useRef<HTMLInputElement>(null);

  return (
    <div className="screen active">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1>電気イスゲーム</h1>
        <p className="hint">2人用 戦略対戦ゲーム</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label>先攻プレイヤー</label>
          <input ref={p1Ref} type="text" defaultValue="Player 1" placeholder="Player 1" />
        </div>
        <div className="field">
          <label>後攻プレイヤー</label>
          <input ref={p2Ref} type="text" defaultValue="Player 2" placeholder="Player 2" />
        </div>
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
        onClick={() => onStart(
          p1Ref.current?.value.trim() || 'Player 1',
          p2Ref.current?.value.trim() || 'Player 2',
        )}
      >
        ゲームスタート
      </button>
    </div>
  );
}
