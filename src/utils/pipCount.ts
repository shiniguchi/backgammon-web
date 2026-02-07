import { GameState, PlayerColor } from '@/game/types';
import { BAR_INDEX } from '@/game/constants';

export const calculatePipCount = (state: GameState, color: PlayerColor): number => {
  let pipCount = 0;

  // Count checkers on board
  for (let i = 0; i < 24; i++) {
    if (state.board[i].color === color) {
      if (color === 'white') {
        // White moves from high to low, bears off past 0
        // Pip count is pointIndex + 1
        pipCount += (i + 1) * state.board[i].count;
      } else {
        // Black moves from low to high, bears off past 23
        // Pip count is 24 - pointIndex
        pipCount += (24 - i) * state.board[i].count;
      }
    }
  }

  // Count checkers on bar (25 pips each)
  pipCount += state.bar[color] * 25;

  return pipCount;
};
