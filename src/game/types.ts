export type PlayerColor = 'white' | 'black';

export interface PointState {
  count: number;
  color: PlayerColor | null;
}

export interface DiceState {
  values: [number, number];
  remaining: number[];
  rolled: boolean;
}

export interface DoublingCubeState {
  value: number;
  owner: PlayerColor | null;
  offered: boolean;
  offeredBy: PlayerColor | null;
}

export interface MoveRecord {
  from: number;
  to: number;
  dieValue: number;
  hitOpponent: boolean;
}

export interface TurnSnapshot {
  board: PointState[];
  bar: Record<PlayerColor, number>;
  borneOff: Record<PlayerColor, number>;
  diceRemaining: number[];
}

export type GamePhase = 'setup' | 'opening_roll' | 'playing' | 'doubling_offered' | 'game_over';

export interface GameState {
  phase: GamePhase;
  board: PointState[];
  bar: Record<PlayerColor, number>;
  borneOff: Record<PlayerColor, number>;
  currentPlayer: PlayerColor;
  dice: DiceState;
  doublingCube: DoublingCubeState;
  selectedPoint: number | null;
  validMoves: number[];
  moveHistory: MoveRecord[];
  turnSnapshot: TurnSnapshot | null;
  winner: PlayerColor | null;
  winType: 'normal' | 'gammon' | 'backgammon' | null;
  players: Record<PlayerColor, { name: string }>;
  stakes: number;
  openingRoll: { white: number; black: number } | null;
  message: string | null;
}

export type GameAction =
  | { type: 'SET_PLAYERS'; white: string; black: string }
  | { type: 'ROLL_DICE' }
  | { type: 'SELECT_POINT'; pointIndex: number }
  | { type: 'MOVE_CHECKER'; from: number; to: number; dieValue: number }
  | { type: 'UNDO_MOVE' }
  | { type: 'UNDO_ALL' }
  | { type: 'CONFIRM_TURN' }
  | { type: 'OFFER_DOUBLE' }
  | { type: 'ACCEPT_DOUBLE' }
  | { type: 'DECLINE_DOUBLE' }
  | { type: 'NEW_GAME' }
  | { type: 'CLEAR_MESSAGE' };
