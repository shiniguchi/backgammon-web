'use client';

import { PlayerColor } from '@/game/types';
import { Checker } from './Checker';
import { BAR_INDEX } from '@/game/constants';

interface BarProps {
  whiteCount: number;
  blackCount: number;
  selectedPoint: number | null;
  currentPlayer: PlayerColor;
  isValidSource: boolean;
  onClickWhite: () => void;
  onClickBlack: () => void;
}

export const Bar: React.FC<BarProps> = ({
  whiteCount,
  blackCount,
  selectedPoint,
  currentPlayer,
  isValidSource,
  onClickWhite,
  onClickBlack,
}) => {
  const whiteCheckers: React.ReactNode[] = [];
  const blackCheckers: React.ReactNode[] = [];

  // White checkers (bottom half)
  for (let i = 0; i < Math.min(whiteCount, 4); i++) {
    const isTop = i === Math.min(whiteCount, 4) - 1;
    whiteCheckers.push(
      <Checker
        key={i}
        color="white"
        isSelected={selectedPoint === BAR_INDEX && currentPlayer === 'white' && isTop}
        isTopOfStack={isTop}
        onClick={currentPlayer === 'white' ? onClickWhite : undefined}
        stackIndex={i}
        totalInStack={whiteCount}
      />
    );
  }

  // Black checkers (top half)
  for (let i = 0; i < Math.min(blackCount, 4); i++) {
    const isTop = i === Math.min(blackCount, 4) - 1;
    blackCheckers.push(
      <Checker
        key={i}
        color="black"
        isSelected={selectedPoint === BAR_INDEX && currentPlayer === 'black' && isTop}
        isTopOfStack={isTop}
        onClick={currentPlayer === 'black' ? onClickBlack : undefined}
        stackIndex={i}
        totalInStack={blackCount}
      />
    );
  }

  return (
    <div className="w-14 h-full bar-area flex flex-col items-center justify-center relative">
      {/* Black checkers (top half) */}
      <div
        className={`
          relative w-12 h-1/2 flex items-start justify-center pt-4
          ${isValidSource && currentPlayer === 'black' && blackCount > 0 ? 'valid-source' : ''}
        `}
        onClick={currentPlayer === 'black' ? onClickBlack : undefined}
      >
        {blackCount > 0 && (
          <div className="relative w-11 h-28">
            {blackCheckers}
          </div>
        )}
        {blackCount > 4 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-red-400 bg-black/50 px-1.5 py-0.5 rounded">
            +{blackCount - 4}
          </div>
        )}
      </div>

      {/* Decorative divider */}
      <div className="w-10 h-1 rounded-full bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />

      {/* White checkers (bottom half) */}
      <div
        className={`
          relative w-12 h-1/2 flex items-end justify-center pb-4
          ${isValidSource && currentPlayer === 'white' && whiteCount > 0 ? 'valid-source' : ''}
        `}
        onClick={currentPlayer === 'white' ? onClickWhite : undefined}
      >
        {whiteCount > 0 && (
          <div className="relative w-11 h-28 flex flex-col-reverse">
            {whiteCheckers}
          </div>
        )}
        {whiteCount > 4 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-red-400 bg-black/50 px-1.5 py-0.5 rounded">
            +{whiteCount - 4}
          </div>
        )}
      </div>
    </div>
  );
};
