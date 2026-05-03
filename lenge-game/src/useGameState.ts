import { useReducer } from 'react';
import type { GameState, Player } from './types';
import { WIN_SCORE, MAX_OUTS, MAX_TURNS, LENGE_COUNT } from './types';

export type Action =
  | { type: 'SELECT_OUT'; n: number }
  | { type: 'SETTER_DONE' }
  | { type: 'CHOOSE'; n: number }
  | { type: 'CONTINUE' }
  | { type: 'RESET' }
  | { type: 'SYNC_STATE'; state: GameState };

const makePlayer = (name: string): Player => ({ name, score: 0, outCount: 0 });

export const initialGameState: GameState = {
  phase: 'START',
  players: [makePlayer('Player 1'), makePlayer('Player 2')],
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
};

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SYNC_STATE':
      return action.state;

    case 'SELECT_OUT': {
      const next = new Set(state.outNumbers);
      if (next.has(action.n)) {
        next.delete(action.n);
      } else {
        next.clear();
        next.add(action.n);
      }
      return { ...state, outNumbers: next };
    }

    case 'SETTER_DONE':
      return { ...state, phase: 'CHOOSER_PICK' };

    case 'CHOOSE': {
      const n = action.n;
      const isOut = state.outNumbers.has(n);
      const players = state.players.map((p) => ({ ...p })) as [Player, Player];
      const chooser = players[state.chooserIdx];

      if (isOut) {
        chooser.score = 0;
        chooser.outCount += 1;
      } else {
        chooser.score += n;
      }

      const newDeactivated = new Set(state.deactivated);
      if (!isOut) newDeactivated.add(n);

      const scoreDelta = isOut ? 0 : n;
      const newHistory = [
        ...state.history,
        { turn: state.turn, playerIdx: state.chooserIdx, pick: n, isOut, scoreDelta },
      ];

      let gameOver = false;
      let winnerIdx: 0 | 1 | -1 = -1;
      let winReason = '';

      if (chooser.score >= WIN_SCORE) {
        gameOver = true;
        winnerIdx = state.chooserIdx;
        winReason = `スコア ${chooser.score} 点で勝利！`;
      } else if (chooser.outCount >= MAX_OUTS) {
        gameOver = true;
        winnerIdx = state.setterIdx;
        winReason = `${chooser.name} がアウト ${MAX_OUTS} 回で敗北`;
      } else if (state.turn >= MAX_TURNS) {
        gameOver = true;
        const [s0, s1] = [players[0].score, players[1].score];
        if (s0 > s1) {
          winnerIdx = 0;
          winReason = `${players[0].name} がスコア ${s0} 点で勝利`;
        } else if (s1 > s0) {
          winnerIdx = 1;
          winReason = `${players[1].name} がスコア ${s1} 点で勝利`;
        } else {
          winnerIdx = -1;
          winReason = '引き分け';
        }
      } else {
        const activeCount = Array.from({ length: LENGE_COUNT }, (_, i) => i + 1)
          .filter((i) => !newDeactivated.has(i)).length;
        if (activeCount === 1) {
          gameOver = true;
          const [s0, s1] = [players[0].score, players[1].score];
          if (s0 > s1) {
            winnerIdx = 0;
            winReason = `残りイス1枚 — ${players[0].name} がスコア ${s0} 点で勝利`;
          } else if (s1 > s0) {
            winnerIdx = 1;
            winReason = `残りイス1枚 — ${players[1].name} がスコア ${s1} 点で勝利`;
          } else {
            winnerIdx = -1;
            winReason = '残りイス1枚 — 引き分け';
          }
        }
      }

      if (!gameOver) {
        const remainingSum = Array.from({ length: LENGE_COUNT }, (_, i) => i + 1)
          .filter((i) => !newDeactivated.has(i))
          .reduce((a, b) => a + b, 0);
        const [s0, s1] = [players[0].score, players[1].score];
        if (s0 !== s1) {
          const trailingScore = Math.min(s0, s1);
          const leadingScore = Math.max(s0, s1);
          if (trailingScore + remainingSum < leadingScore) {
            gameOver = true;
            winnerIdx = s0 > s1 ? 0 : 1;
            winReason = `逆転不可のスコア差により ${players[winnerIdx].name} が勝利`;
          }
        }
      }

      return {
        ...state,
        players,
        deactivated: newDeactivated,
        lastPick: n,
        lastIsOut: isOut,
        history: newHistory,
        gameOver,
        winnerIdx,
        winReason,
        phase: 'RESULT',
      };
    }

    case 'CONTINUE': {
      if (state.gameOver) return { ...state, phase: 'GAME_OVER' };
      return {
        ...state,
        setterIdx: state.chooserIdx,
        chooserIdx: state.setterIdx,
        turn: state.turn + 1,
        outNumbers: new Set(),
        phase: 'SETTER_SETUP',
      };
    }

    case 'RESET':
      return { ...initialGameState };

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, initialGameState);
  return { state, dispatch };
}
