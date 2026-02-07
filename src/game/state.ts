import { GameState, PointState } from './types';
import { INITIAL_BOARD } from './constants';
import { initialDoublingCube } from './doublingCube';

export const createInitialState = (): GameState => {
  return {
    phase: 'setup',
    board: INITIAL_BOARD.map((p) => ({ ...p })),
    bar: { white: 0, black: 0 },
    borneOff: { white: 0, black: 0 },
    currentPlayer: 'white',
    dice: {
      values: [0, 0],
      remaining: [],
      rolled: false,
    },
    doublingCube: { ...initialDoublingCube },
    selectedPoint: null,
    validMoves: [],
    moveHistory: [],
    turnSnapshot: null,
    winner: null,
    winType: null,
    players: {
      white: { name: 'Player 1' },
      black: { name: 'Player 2' },
    },
    stakes: 1,
    openingRoll: null,
    message: null,
  };
};

export const createTurnSnapshot = (state: GameState) => {
  return {
    board: state.board.map((p) => ({ ...p })),
    bar: { ...state.bar },
    borneOff: { ...state.borneOff },
    diceRemaining: [...state.dice.remaining],
  };
};

export const cloneBoard = (board: PointState[]): PointState[] => {
  return board.map((p) => ({ ...p }));
};
