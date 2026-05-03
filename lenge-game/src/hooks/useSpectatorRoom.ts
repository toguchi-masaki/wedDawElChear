import { useState, useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { deserialize } from '../lib/roomUtils';
import { initialGameState } from '../useGameState';
import type { GameState } from '../types';

export function useSpectatorRoom(roomId: string) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let gameChannel: RealtimeChannel;

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

      gameChannel = supabase
        .channel(`room_${roomId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
          (payload) => {
            const incoming = payload.new as { game_state: Record<string, unknown> };
            setGameState(deserialize(incoming.game_state));
          }
        )
        .subscribe();

      // Presence で観戦者数をリアルタイム集計
      const presenceKey = crypto.randomUUID();
      const presenceChannel = supabase.channel(`spectators_${roomId}`, {
        config: { presence: { key: presenceKey } },
      });
      presenceChannelRef.current = presenceChannel;

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          setSpectatorCount(Object.keys(state).length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ joined_at: Date.now() });
          }
        });
    }

    init();

    return () => {
      if (gameChannel) supabase.removeChannel(gameChannel);
      if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
    };
  }, [roomId]);

  return { gameState, spectatorCount, isLoading, error };
}
