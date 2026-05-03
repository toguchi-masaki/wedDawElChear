import { useEffect, useRef, useState } from 'react';

interface Props {
  timerStartedAt: string;
  timerSeconds: number;
  onExpire?: () => void;
}

export function CountdownTimer({ timerStartedAt, timerSeconds, onExpire }: Props) {
  const [remaining, setRemaining] = useState(() => calcRemaining(timerStartedAt, timerSeconds));
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    setRemaining(calcRemaining(timerStartedAt, timerSeconds));

    const id = setInterval(() => {
      const r = calcRemaining(timerStartedAt, timerSeconds);
      setRemaining(r);
      if (r <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    }, 200);

    return () => clearInterval(id);
  }, [timerStartedAt, timerSeconds, onExpire]);

  const pct = Math.max(0, Math.min(100, (remaining / timerSeconds) * 100));
  const urgent = remaining <= 10;

  return (
    <div className="countdown-wrap">
      <div className={`countdown-number ${urgent ? 'urgent' : ''}`}>
        {Math.max(0, remaining)}
      </div>
      <div className="countdown-bar-bg">
        <div
          className={`countdown-bar ${urgent ? 'urgent' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function calcRemaining(startedAt: string, seconds: number): number {
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
  return Math.ceil(seconds - elapsed);
}
