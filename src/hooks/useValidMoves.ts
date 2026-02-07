'use client';

import { useMemo } from 'react';
import { useGame } from './useGame';
import { getValidSourcePoints } from '@/game/moves';

export const useValidMoves = () => {
  const { state } = useGame();

  const validSourcePoints = useMemo(() => {
    if (!state.dice.rolled || state.phase !== 'playing') {
      return [];
    }
    return getValidSourcePoints(state);
  }, [state]);

  return {
    validSourcePoints,
    selectedPoint: state.selectedPoint,
    validDestinations: state.validMoves,
  };
};
