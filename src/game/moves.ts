import { GameState, PointState, PlayerColor, MoveRecord } from './types';
import {
  BAR_INDEX,
  BEAR_OFF_INDEX,
  getOpponent,
  getMoveDirection,
  getBarEntryPoint,
  WHITE_HOME_START,
  WHITE_HOME_END,
  BLACK_HOME_START,
  BLACK_HOME_END,
  CHECKERS_PER_PLAYER,
} from './constants';
import { removeDieFromRemaining, getUniqueDice } from './dice';

// Check if a player can bear off (all checkers in home board or borne off)
export const canBearOff = (
  board: PointState[],
  bar: Record<PlayerColor, number>,
  borneOff: Record<PlayerColor, number>,
  color: PlayerColor
): boolean => {
  if (bar[color] > 0) return false;

  const homeStart = color === 'white' ? WHITE_HOME_START : BLACK_HOME_START;
  const homeEnd = color === 'white' ? WHITE_HOME_END : BLACK_HOME_END;

  // Count checkers in home board
  let homeCount = 0;
  for (let i = homeStart; i <= homeEnd; i++) {
    if (board[i].color === color) {
      homeCount += board[i].count;
    }
  }

  // All 15 checkers must be in home board or already borne off
  return homeCount + borneOff[color] === CHECKERS_PER_PLAYER;
};

// Check if a point is open for landing (empty, own checkers, or single opponent)
export const isPointOpen = (board: PointState[], pointIndex: number, color: PlayerColor): boolean => {
  const point = board[pointIndex];
  if (point.count === 0) return true;
  if (point.color === color) return true;
  if (point.color !== color && point.count === 1) return true; // Can hit
  return false;
};

// Get all valid moves for a single die from the current position
export const getValidMovesForDie = (
  board: PointState[],
  bar: Record<PlayerColor, number>,
  borneOff: Record<PlayerColor, number>,
  color: PlayerColor,
  dieValue: number,
  fromPoint: number
): number[] => {
  const validMoves: number[] = [];
  const direction = getMoveDirection(color);

  // If moving from bar
  if (fromPoint === BAR_INDEX) {
    const entryPoint = getBarEntryPoint(color, dieValue);
    if (isPointOpen(board, entryPoint, color)) {
      validMoves.push(entryPoint);
    }
    return validMoves;
  }

  // Regular move
  const toPoint = fromPoint + direction * dieValue;

  // Check if bearing off
  if (canBearOff(board, bar, borneOff, color)) {
    const homeStart = color === 'white' ? WHITE_HOME_START : BLACK_HOME_START;
    const homeEnd = color === 'white' ? WHITE_HOME_END : BLACK_HOME_END;

    // White bears off past point 0 (negative), Black bears off past point 23 (>23)
    const bearOffCondition = color === 'white' ? toPoint < 0 : toPoint > 23;

    if (bearOffCondition) {
      // Exact bear off or overshoot
      const distanceFromBearOff = color === 'white' ? fromPoint + 1 : 24 - fromPoint;

      if (dieValue === distanceFromBearOff) {
        // Exact match - can bear off
        validMoves.push(BEAR_OFF_INDEX);
      } else if (dieValue > distanceFromBearOff) {
        // Overshoot - can only bear off if no checker is further from bear off
        let hasFurtherChecker = false;
        if (color === 'white') {
          // Check if any white checker is on a higher point (further from bear off)
          for (let i = fromPoint + 1; i <= homeEnd; i++) {
            if (board[i].color === color && board[i].count > 0) {
              hasFurtherChecker = true;
              break;
            }
          }
        } else {
          // Check if any black checker is on a lower point (further from bear off)
          for (let i = homeStart; i < fromPoint; i++) {
            if (board[i].color === color && board[i].count > 0) {
              hasFurtherChecker = true;
              break;
            }
          }
        }
        if (!hasFurtherChecker) {
          validMoves.push(BEAR_OFF_INDEX);
        }
      }
    }
  }

  // Regular move to a point on the board
  if (toPoint >= 0 && toPoint <= 23) {
    if (isPointOpen(board, toPoint, color)) {
      validMoves.push(toPoint);
    }
  }

  return validMoves;
};

// Get all possible immediate moves for a player given remaining dice
export const getAllImmediateMoves = (
  board: PointState[],
  bar: Record<PlayerColor, number>,
  borneOff: Record<PlayerColor, number>,
  color: PlayerColor,
  remaining: number[]
): Array<{ from: number; to: number; dieValue: number }> => {
  const moves: Array<{ from: number; to: number; dieValue: number }> = [];
  const uniqueDice = getUniqueDice(remaining);

  // If player has checkers on bar, must move from bar first
  if (bar[color] > 0) {
    for (const die of uniqueDice) {
      const validTos = getValidMovesForDie(board, bar, borneOff, color, die, BAR_INDEX);
      for (const to of validTos) {
        moves.push({ from: BAR_INDEX, to, dieValue: die });
      }
    }
    return moves;
  }

  // Otherwise, can move any checker
  for (let i = 0; i < 24; i++) {
    if (board[i].color === color && board[i].count > 0) {
      for (const die of uniqueDice) {
        const validTos = getValidMovesForDie(board, bar, borneOff, color, die, i);
        for (const to of validTos) {
          moves.push({ from: i, to, dieValue: die });
        }
      }
    }
  }

  return moves;
};

// Apply a move to the board state (returns new state, does not mutate)
export const applyMove = (
  board: PointState[],
  bar: Record<PlayerColor, number>,
  borneOff: Record<PlayerColor, number>,
  color: PlayerColor,
  from: number,
  to: number
): {
  board: PointState[];
  bar: Record<PlayerColor, number>;
  borneOff: Record<PlayerColor, number>;
  hitOpponent: boolean;
} => {
  const newBoard = board.map((p) => ({ ...p }));
  const newBar = { ...bar };
  const newBorneOff = { ...borneOff };
  let hitOpponent = false;
  const opponent = getOpponent(color);

  // Remove checker from source
  if (from === BAR_INDEX) {
    newBar[color]--;
  } else {
    newBoard[from].count--;
    if (newBoard[from].count === 0) {
      newBoard[from].color = null;
    }
  }

  // Add checker to destination
  if (to === BEAR_OFF_INDEX) {
    newBorneOff[color]++;
  } else {
    // Check for hit
    if (newBoard[to].color === opponent && newBoard[to].count === 1) {
      hitOpponent = true;
      newBoard[to].count = 0;
      newBoard[to].color = null;
      newBar[opponent]++;
    }
    newBoard[to].count++;
    newBoard[to].color = color;
  }

  return { board: newBoard, bar: newBar, borneOff: newBorneOff, hitOpponent };
};

// Recursively find all possible move sequences
interface MoveSequence {
  moves: MoveRecord[];
  board: PointState[];
  bar: Record<PlayerColor, number>;
  borneOff: Record<PlayerColor, number>;
}

const getAllMoveSequencesRecursive = (
  board: PointState[],
  bar: Record<PlayerColor, number>,
  borneOff: Record<PlayerColor, number>,
  color: PlayerColor,
  remaining: number[],
  currentMoves: MoveRecord[]
): MoveSequence[] => {
  const immediates = getAllImmediateMoves(board, bar, borneOff, color, remaining);

  if (immediates.length === 0) {
    return [{ moves: currentMoves, board, bar, borneOff }];
  }

  const sequences: MoveSequence[] = [];

  // Track which (from, to, die) combinations we've tried to avoid duplicates
  const tried = new Set<string>();

  for (const move of immediates) {
    const key = `${move.from}-${move.to}-${move.dieValue}`;
    if (tried.has(key)) continue;
    tried.add(key);

    const result = applyMove(board, bar, borneOff, color, move.from, move.to);
    const newRemaining = removeDieFromRemaining(remaining, move.dieValue);
    const moveRecord: MoveRecord = {
      from: move.from,
      to: move.to,
      dieValue: move.dieValue,
      hitOpponent: result.hitOpponent,
    };

    const subSequences = getAllMoveSequencesRecursive(
      result.board,
      result.bar,
      result.borneOff,
      color,
      newRemaining,
      [...currentMoves, moveRecord]
    );

    sequences.push(...subSequences);
  }

  return sequences.length > 0 ? sequences : [{ moves: currentMoves, board, bar, borneOff }];
};

// Get all legal move sequences (filtered by max dice usage rule)
export const getAllLegalMoveSequences = (
  board: PointState[],
  bar: Record<PlayerColor, number>,
  borneOff: Record<PlayerColor, number>,
  color: PlayerColor,
  remaining: number[]
): MoveSequence[] => {
  const allSequences = getAllMoveSequencesRecursive(board, bar, borneOff, color, remaining, []);

  if (allSequences.length === 0) return [];

  // Filter: keep only sequences that use the maximum number of dice
  const maxLen = Math.max(...allSequences.map((s) => s.moves.length));
  let filtered = allSequences.filter((s) => s.moves.length === maxLen);

  // If maxLen is 1 and two different die values possible, keep only the higher die
  if (maxLen === 1 && remaining.length === 2 && remaining[0] !== remaining[1]) {
    const higherDie = Math.max(...remaining);
    const higherSequences = filtered.filter((s) => s.moves[0]?.dieValue === higherDie);
    if (higherSequences.length > 0) {
      filtered = higherSequences;
    }
  }

  return filtered;
};

// Get valid destinations for a selected point given current state
export const getValidDestinationsForPoint = (
  state: GameState,
  fromPoint: number
): number[] => {
  const { board, bar, borneOff, currentPlayer, dice } = state;

  // Get all legal sequences from current position
  const sequences = getAllLegalMoveSequences(
    board,
    bar,
    borneOff,
    currentPlayer,
    dice.remaining
  );

  // Find all destinations that are reachable as the first move
  const validDests = new Set<number>();

  for (const seq of sequences) {
    if (seq.moves.length > 0 && seq.moves[0].from === fromPoint) {
      validDests.add(seq.moves[0].to);
    }
  }

  return Array.from(validDests);
};

// Check if the player has any legal moves
export const hasLegalMoves = (state: GameState): boolean => {
  const { board, bar, borneOff, currentPlayer, dice } = state;
  const sequences = getAllLegalMoveSequences(board, bar, borneOff, currentPlayer, dice.remaining);
  return sequences.some((s) => s.moves.length > 0);
};

// Get all valid source points for moves
export const getValidSourcePoints = (state: GameState): number[] => {
  const { board, bar, borneOff, currentPlayer, dice } = state;

  const sequences = getAllLegalMoveSequences(board, bar, borneOff, currentPlayer, dice.remaining);
  const sources = new Set<number>();

  for (const seq of sequences) {
    if (seq.moves.length > 0) {
      sources.add(seq.moves[0].from);
    }
  }

  return Array.from(sources);
};
