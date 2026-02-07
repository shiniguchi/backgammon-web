import { PointState, PlayerColor } from './types';

export const TOTAL_POINTS = 24;
export const BAR_INDEX = 24;
export const BEAR_OFF_INDEX = 25;
export const CHECKERS_PER_PLAYER = 15;

// Initial board setup
// White moves from 23 → 0 (bears off past point 0), home board is 0-5
// Black moves from 0 → 23 (bears off past point 23), home board is 18-23
// Each player starts with 2 checkers in opponent's home (farthest from own home)
export const INITIAL_BOARD: PointState[] = [
  { count: 2, color: 'black' },    // Point 0 - Black's back checkers (in White's home)
  { count: 0, color: null },       // Point 1
  { count: 0, color: null },       // Point 2
  { count: 0, color: null },       // Point 3
  { count: 0, color: null },       // Point 4
  { count: 5, color: 'white' },    // Point 5 - White's 5 (near White's home)
  { count: 0, color: null },       // Point 6
  { count: 3, color: 'white' },    // Point 7 - White's 3
  { count: 0, color: null },       // Point 8
  { count: 0, color: null },       // Point 9
  { count: 0, color: null },       // Point 10
  { count: 5, color: 'black' },    // Point 11 - Black's 5
  { count: 5, color: 'white' },    // Point 12 - White's 5
  { count: 0, color: null },       // Point 13
  { count: 0, color: null },       // Point 14
  { count: 0, color: null },       // Point 15
  { count: 3, color: 'black' },    // Point 16 - Black's 3
  { count: 0, color: null },       // Point 17
  { count: 5, color: 'black' },    // Point 18 - Black's 5 (near Black's home)
  { count: 0, color: null },       // Point 19
  { count: 0, color: null },       // Point 20
  { count: 0, color: null },       // Point 21
  { count: 0, color: null },       // Point 22
  { count: 2, color: 'white' },    // Point 23 - White's back checkers (in Black's home)
];

// Home board ranges
export const WHITE_HOME_START = 0;
export const WHITE_HOME_END = 5;
export const BLACK_HOME_START = 18;
export const BLACK_HOME_END = 23;

// Bar entry points
export const getBarEntryPoints = (color: PlayerColor): number[] => {
  // White re-enters on points 18–23 (opponent's home board)
  // Black re-enters on points 0–5 (opponent's home board)
  if (color === 'white') {
    return [18, 19, 20, 21, 22, 23];
  } else {
    return [0, 1, 2, 3, 4, 5];
  }
};

// Get bar entry point for a die value
export const getBarEntryPoint = (color: PlayerColor, dieValue: number): number => {
  // White enters at 25 - dieValue (so die 1 → point 24, but we use 0-23, so 24-dieValue would be wrong)
  // Actually: White re-enters at opponent's home (points 18-23)
  // Die 1 → point 23, Die 2 → point 22, etc.
  // Black re-enters at opponent's home (points 0-5)
  // Die 1 → point 0, Die 2 → point 1, etc.
  if (color === 'white') {
    return 24 - dieValue; // die 1 → 23, die 6 → 18
  } else {
    return dieValue - 1; // die 1 → 0, die 6 → 5
  }
};

export const getOpponent = (color: PlayerColor): PlayerColor => {
  return color === 'white' ? 'black' : 'white';
};

// Movement direction
export const getMoveDirection = (color: PlayerColor): number => {
  // White moves from high to low (23 → 0), so direction is -1
  // Black moves from low to high (0 → 23), so direction is +1
  return color === 'white' ? -1 : 1;
};
