import { DoublingCubeState, PlayerColor } from './types';

export const initialDoublingCube: DoublingCubeState = {
  value: 1,
  owner: null,
  offered: false,
  offeredBy: null,
};

// Check if a player can offer a double
export const canOfferDouble = (cube: DoublingCubeState, player: PlayerColor): boolean => {
  // Cannot offer if already at max value
  if (cube.value >= 64) return false;

  // Cannot offer if there's already a pending offer
  if (cube.offered) return false;

  // Can offer if cube is centered (no owner) or player owns the cube
  return cube.owner === null || cube.owner === player;
};

// Offer a double
export const offerDouble = (cube: DoublingCubeState, player: PlayerColor): DoublingCubeState => {
  return {
    ...cube,
    offered: true,
    offeredBy: player,
  };
};

// Accept a double
export const acceptDouble = (cube: DoublingCubeState): DoublingCubeState => {
  const acceptingPlayer = cube.offeredBy === 'white' ? 'black' : 'white';
  return {
    value: cube.value * 2,
    owner: acceptingPlayer,
    offered: false,
    offeredBy: null,
  };
};

// Decline a double (game ends - handled in reducer)
export const declineDouble = (cube: DoublingCubeState): DoublingCubeState => {
  return {
    ...cube,
    offered: false,
    offeredBy: null,
  };
};
