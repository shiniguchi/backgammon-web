import { PlayerColor } from '@/game/types';

// Convert board point index to display position
// Top row: points 13-24 (indices 12-23) displayed left to right
// Bottom row: points 12-1 (indices 11-0) displayed left to right
export const getDisplayPosition = (
  pointIndex: number,
  row: 'top' | 'bottom',
  quadrant: 'left' | 'right'
): number | null => {
  if (row === 'top') {
    if (quadrant === 'left') {
      // Points 13-18 (indices 12-17) → positions 0-5
      if (pointIndex >= 12 && pointIndex <= 17) {
        return pointIndex - 12;
      }
    } else {
      // Points 19-24 (indices 18-23) → positions 0-5
      if (pointIndex >= 18 && pointIndex <= 23) {
        return pointIndex - 18;
      }
    }
  } else {
    if (quadrant === 'left') {
      // Points 12-7 (indices 11-6) → positions 0-5
      if (pointIndex >= 6 && pointIndex <= 11) {
        return 11 - pointIndex;
      }
    } else {
      // Points 6-1 (indices 5-0) → positions 0-5
      if (pointIndex >= 0 && pointIndex <= 5) {
        return 5 - pointIndex;
      }
    }
  }
  return null;
};

// Get point indices for a specific row and quadrant
export const getPointIndices = (
  row: 'top' | 'bottom',
  quadrant: 'left' | 'right'
): number[] => {
  if (row === 'top') {
    if (quadrant === 'left') {
      return [12, 13, 14, 15, 16, 17];
    } else {
      return [18, 19, 20, 21, 22, 23];
    }
  } else {
    if (quadrant === 'left') {
      return [11, 10, 9, 8, 7, 6];
    } else {
      return [5, 4, 3, 2, 1, 0];
    }
  }
};

// Get point number for display (1-24)
export const getPointNumber = (pointIndex: number): number => {
  return pointIndex + 1;
};

// Check if a point is in a player's home board
export const isInHomeBoard = (pointIndex: number, color: PlayerColor): boolean => {
  if (color === 'white') {
    return pointIndex >= 0 && pointIndex <= 5;
  } else {
    return pointIndex >= 18 && pointIndex <= 23;
  }
};
