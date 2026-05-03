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

  useEffect(() => {
    const stored = localStorage.getItem(`room_${roomId}_playerIdx`);
    if (stored !== null) setMyIdx(parseInt(stored) as 0 | 1);
  }, [roomId]);

  useEffect(() => {
    let channel: RealtimeChannel;

    async function init() {
      const { data, error: fetchError } = await supabase
        .from('rooms')
        .select('game_state')
        .eq('id', roomId)
        .single();

      if (fetchError || !data) {
        setError('ルームが見つかりません');
        setIsLoading(false);
        return;
      }

      setGameState(deserialize(data.game_state as Record<string, unknown>));
      setIsLoading(false);

      channel = supabase
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
          setIsConnected(status === 'SUBSCRIBED');
        });
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomId]);

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

  return { gameState, dispatch, myIdx, isLoading, isConnected, error, opponentConnected };
}
