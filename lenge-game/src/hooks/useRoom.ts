import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { serialize, deserialize } from '../lib/roomUtils';
import { reducer, initialGameState } from '../useGameState';
import type { Action } from '../useGameState';
import type { GameState } from '../types';

export function useRoom(roomId: string) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [myIdx, setMyIdx] = useState<0 | 1 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(true);
  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const opponentEverSeenRef = useRef(false);
  const pendingPickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPickValueRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isConnectedRef = useRef(false);
  const [hasConnected, setHasConnected] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`room_${roomId}_playerIdx`);
    if (stored !== null) setMyIdx(parseInt(stored) as 0 | 1);
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (pendingPickTimerRef.current) clearTimeout(pendingPickTimerRef.current);
    };
  }, []);

  const refetchState = useCallback(async (): Promise<boolean> => {
    const { data, error: fetchError } = await supabase
      .from('rooms')
      .select('game_state')
      .eq('id', roomId)
      .single();

    if (fetchError || !data) return false;

    setGameState(deserialize(data.game_state as Record<string, unknown>));
    return true;
  }, [roomId]);

  const subscribeRoomChannel = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    channelRef.current = supabase
      .channel(`room_${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const incoming = payload.new as { game_state: Record<string, unknown> };
          setGameState(deserialize(incoming.game_state));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isConnectedRef.current = true;
          setHasConnected(true);
          setIsConnected(true);
          // 再購読時に切断中の取りこぼしを取り直す
          refetchState();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          isConnectedRef.current = false;
          setIsConnected(false);
        }
      });
  }, [roomId, refetchState]);

  const resync = useCallback(() => {
    refetchState();
    subscribeRoomChannel();
  }, [refetchState, subscribeRoomChannel]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      const ok = await refetchState();
      if (cancelled) return;
      if (!ok) {
        setError('ルームが見つかりません');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      subscribeRoomChannel();
    }

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, refetchState, subscribeRoomChannel]);

  // タブ復帰・ネット復帰時に再取得し、接続が落ちていれば張り直す
  useEffect(() => {
    const recover = () => {
      refetchState();
      if (!isConnectedRef.current) subscribeRoomChannel();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') recover();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', recover);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', recover);
    };
  }, [refetchState, subscribeRoomChannel]);

  // Supabase Presence で相手の接続状態を監視
  useEffect(() => {
    if (myIdx === null) return;

    const opponentIdx = myIdx === 0 ? 1 : 0;
    let presenceChannel: RealtimeChannel;

    presenceChannel = supabase
      .channel(`players_${roomId}_presence`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState<{ playerIdx: number }>();
        const opponentPresent = Object.values(presenceState).some((presences) =>
          presences.some((p) => p.playerIdx === opponentIdx)
        );

        if (opponentPresent) {
          opponentEverSeenRef.current = true;
          setOpponentConnected(true);
        } else if (opponentEverSeenRef.current) {
          setOpponentConnected(false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ playerIdx: myIdx });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [roomId, myIdx]);

  const dispatch = useCallback(
    (action: Action) => {
      // pendingPick の遅延書き込みをキャンセル
      if (pendingPickTimerRef.current) {
        clearTimeout(pendingPickTimerRef.current);
        pendingPickTimerRef.current = null;
      }
      const newState = reducer(stateRef.current, action);
      setGameState(newState);
      supabase
        .from('rooms')
        .update({ game_state: serialize(newState) })
        .eq('id', roomId)
        .then(({ error: e }) => {
          if (e) console.error('room update failed:', e);
        });
    },
    [roomId]
  );

  // 守備側の選択中状態をデバウンスして Supabase に同期する
  const updatePendingPick = useCallback(
    (n: number | null) => {
      pendingPickValueRef.current = n;
      const newState = { ...stateRef.current, pendingPick: n };
      setGameState(newState);
      stateRef.current = newState;

      if (pendingPickTimerRef.current) clearTimeout(pendingPickTimerRef.current);
      pendingPickTimerRef.current = setTimeout(() => {
        supabase
          .from('rooms')
          .update({ game_state: serialize({ ...stateRef.current, pendingPick: pendingPickValueRef.current }) })
          .eq('id', roomId)
          .then(({ error: e }) => {
            if (e) console.error('pendingPick update failed:', e);
          });
      }, 500);
    },
    [roomId]
  );

  const disconnected = hasConnected && !isConnected;

  return { gameState, dispatch, updatePendingPick, resync, myIdx, isLoading, isConnected, disconnected, error, opponentConnected };
}
