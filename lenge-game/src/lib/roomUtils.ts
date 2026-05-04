import type { GameState, Player } from '../types';
import { supabase } from './supabase';

export function serialize(state: GameState): object {
  return {
    ...state,
    deactivated: Array.from(state.deactivated),
    outNumbers: Array.from(state.outNumbers),
  };
}

export function deserialize(data: Record<string, unknown>): GameState {
  const base = data as unknown as GameState;
  return {
    ...base,
    deactivated: new Set((data.deactivated as number[]) ?? []),
    outNumbers: new Set((data.outNumbers as number[]) ?? []),
    readyFlags: (data.readyFlags as [boolean, boolean]) ?? [false, false],
    pendingPick: (data.pendingPick as number | null) ?? null,
  };
}

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const makePlayer = (name: string): Player => ({ name, score: 0, outCount: 0 });

export async function createRoom(
  p1name: string,
  timerEnabled = false,
  timerSeconds = 30,
): Promise<string> {
  const roomId = generateRoomId();
  const token = crypto.randomUUID();

  const state: GameState = {
    phase: 'LOBBY',
    players: [makePlayer(p1name), makePlayer('')],
    setterIdx: 0,
    chooserIdx: 1,
    turn: 1,
    deactivated: new Set(),
    outNumbers: new Set(),
    lastPick: null,
    lastIsOut: false,
    history: [],
    gameOver: false,
    winnerIdx: -1,
    winReason: '',
    timerEnabled,
    timerSeconds,
    timerStartedAt: null,
    readyFlags: [false, false],
    aborted: false,
    pendingPick: null,
  };

  const { error } = await supabase.from('rooms').insert({
    id: roomId,
    game_state: serialize(state),
    player1_token: token,
    expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  });

  if (error) throw new Error(error.message);

  localStorage.setItem(`room_${roomId}_token`, token);
  localStorage.setItem(`room_${roomId}_playerIdx`, '0');
  return roomId;
}

export async function joinRoom(roomId: string, p2name: string): Promise<void> {
  const { data, error } = await supabase
    .from('rooms')
    .select('game_state, player2_token')
    .eq('id', roomId)
    .single();

  if (error || !data) throw new Error('ルームが見つかりません');
  if (data.player2_token) throw new Error('このルームはすでに満員です');

  const token = crypto.randomUUID();
  const state = deserialize(data.game_state as Record<string, unknown>);
  state.players[1] = makePlayer(p2name);
  state.phase = 'WAITING_LOBBY';
  state.readyFlags = [false, false];
  state.timerStartedAt = null;

  const { error: updateError } = await supabase
    .from('rooms')
    .update({ player2_token: token, game_state: serialize(state) })
    .eq('id', roomId);

  if (updateError) throw new Error(updateError.message);

  localStorage.setItem(`room_${roomId}_token`, token);
  localStorage.setItem(`room_${roomId}_playerIdx`, '1');
}
