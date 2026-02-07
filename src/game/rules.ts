import { GameState, PlayerColor } from './types';
import { CHECKERS_PER_PLAYER, getOpponent, WHITE_HOME_START, WHITE_HOME_END, BLACK_HOME_START, BLACK_HOME_END } from './constants';

// Check if a player has won
export const checkWinner = (state: GameState): PlayerColor | null => {
  if (state.borneOff.white === CHECKERS_PER_PLAYER) return 'white';
  if (state.borneOff.black === CHECKERS_PER_PLAYER) return 'black';
  return null;
};

// Determine win type
export const getWinType = (
  state: GameState,
  winner: PlayerColor
): 'normal' | 'gammon' | 'backgammon' => {
  const loser = getOpponent(winner);

  // Normal win: opponent has borne off at least 1 checker
  if (state.borneOff[loser] > 0) {
    return 'normal';
  }

  // Check for backgammon: loser has checkers on bar or in winner's home board
  const winnerHomeStart = winner === 'white' ? WHITE_HOME_START : BLACK_HOME_START;
  const winnerHomeEnd = winner === 'white' ? WHITE_HOME_END : BLACK_HOME_END;

  // Check bar
  if (state.bar[loser] > 0) {
    return 'backgammon';
  }

  // Check winner's home board for loser's checkers
  for (let i = winnerHomeStart; i <= winnerHomeEnd; i++) {
    if (state.board[i].color === loser && state.board[i].count > 0) {
      return 'backgammon';
    }
  }

  // Gammon: opponent has not borne off any checkers but no checkers in winner's home
  return 'gammon';
};

// Calculate stakes multiplier based on win type
export const getStakesMultiplier = (winType: 'normal' | 'gammon' | 'backgammon'): number => {
  switch (winType) {
    case 'normal':
      return 1;
    case 'gammon':
      return 2;
    case 'backgammon':
      return 3;
  }
};
