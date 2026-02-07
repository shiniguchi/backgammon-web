'use client';

import { useGameContext } from '@/context/GameContext';

export const useGame = () => {
  return useGameContext();
};
