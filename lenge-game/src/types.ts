export type Phase =
  | 'START'
  | 'LOBBY'
  | 'SETTER_SETUP'
  | 'CHOOSER_PICK'
  | 'RESULT'
  | 'GAME_OVER';

export interface Player {
  name: string;
  score: number;
  outCount: number;
}

export interface TurnRecord {
  turn: number;
  playerIdx: 0 | 1;
  pick: number;
  isOut: boolean;
  scoreDelta: number;
}

export interface GameState {
  phase: Phase;
  players: [Player, Player];
  setterIdx: 0 | 1;
  chooserIdx: 0 | 1;
  turn: number;
  deactivated: Set<number>;
  outNumbers: Set<number>;
  lastPick: number | null;
  lastIsOut: boolean;
  history: TurnRecord[];
  gameOver: boolean;
  winnerIdx: 0 | 1 | -1;
  winReason: string;
}

export const WIN_SCORE = 40;
export const MAX_OUTS = 3;
export const MAX_TURNS = 16;
export const LENGE_COUNT = 12;
