'use client';

import { PointState, PlayerColor } from '@/game/types';
import { Checker } from './Checker';

interface PointProps {
  index: number;
  state: PointState;
  isSelected: boolean;
  isValidTarget: boolean;
  isValidSource: boolean;
  onClick: () => void;
  direction: 'up' | 'down';
  showNumber?: boolean;
}

export const Point: React.FC<PointProps> = ({
  index,
  state,
  isSelected,
  isValidTarget,
  isValidSource,
  onClick,
  direction,
  showNumber = true,
}) => {
  const isEven = index % 2 === 0;

  const checkers: React.ReactNode[] = [];
  const maxVisible = 5;
  const visibleCount = Math.min(state.count, maxVisible);

  for (let i = 0; i < visibleCount; i++) {
    const isTop = i === visibleCount - 1;
    checkers.push(
      <Checker
        key={i}
        color={state.color!}
        isSelected={isSelected && isTop}
        isTopOfStack={isTop}
        onClick={isTop ? onClick : undefined}
        stackIndex={i}
        totalInStack={state.count}
      />
    );
  }

  // Show remaining count if more than maxVisible
  if (state.count > maxVisible) {
    checkers.push(
      <Checker
        key="last"
        color={state.color!}
        isSelected={isSelected}
        isTopOfStack={true}
        onClick={onClick}
        stackIndex={maxVisible - 1}
        totalInStack={state.count}
      />
    );
  }

  // Triangle colors
  const triangleColor = isEven
    ? 'linear-gradient(180deg, #8B4513 0%, #654321 50%, #4a2f17 100%)'  // Dark brown
    : 'linear-gradient(180deg, #D2B48C 0%, #C4A574 50%, #b8956a 100%)'; // Light tan

  return (
    <div
      className={`
        relative flex-1 h-full flex flex-col items-center
        ${direction === 'up' ? 'justify-end' : 'justify-start'}
        cursor-pointer transition-all duration-200
      `}
      onClick={onClick}
    >
      {/* Triangle SVG */}
      <svg
        className={`absolute w-full ${direction === 'down' ? 'top-0' : 'bottom-0'}`}
        style={{ height: '80%' }}
        viewBox="0 0 100 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`triGrad${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            {isEven ? (
              <>
                <stop offset="0%" stopColor="#8B4513" />
                <stop offset="50%" stopColor="#654321" />
                <stop offset="100%" stopColor="#4a2f17" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#D2B48C" />
                <stop offset="50%" stopColor="#C4A574" />
                <stop offset="100%" stopColor="#b8956a" />
              </>
            )}
          </linearGradient>
          {/* Glow filter for valid targets */}
          <filter id={`glow${index}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {direction === 'down' ? (
          <polygon
            points="50,200 0,0 100,0"
            fill={`url(#triGrad${index})`}
            stroke={isValidTarget ? '#00ff88' : isValidSource && !isSelected ? '#ffd700' : 'rgba(0,0,0,0.3)'}
            strokeWidth={isValidTarget || (isValidSource && !isSelected) ? '3' : '1'}
            filter={isValidTarget ? `url(#glow${index})` : undefined}
          />
        ) : (
          <polygon
            points="50,0 0,200 100,200"
            fill={`url(#triGrad${index})`}
            stroke={isValidTarget ? '#00ff88' : isValidSource && !isSelected ? '#ffd700' : 'rgba(0,0,0,0.3)'}
            strokeWidth={isValidTarget || (isValidSource && !isSelected) ? '3' : '1'}
            filter={isValidTarget ? `url(#glow${index})` : undefined}
          />
        )}
      </svg>

      {/* Valid target/source overlay glow */}
      {isValidTarget && (
        <div
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 255, 136, 0.3) 0%, transparent 70%)',
          }}
        />
      )}
      {isValidSource && !isSelected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.2) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Checkers container */}
      <div
        className={`
          relative w-full flex flex-col items-center z-10
          ${direction === 'down' ? 'pt-2' : 'pb-2'}
        `}
        style={{ height: '85%' }}
      >
        {state.count > 0 && (
          <div className="relative w-11" style={{ height: '100%' }}>
            {checkers}
          </div>
        )}
      </div>

      {/* Point number */}
      {showNumber && (
        <div
          className={`
            absolute text-xs font-bold tracking-wide z-20
            ${isEven ? 'text-amber-300/80' : 'text-amber-900/80'}
            ${direction === 'down' ? '-top-5' : '-bottom-5'}
          `}
        >
          {index + 1}
        </div>
      )}
    </div>
  );
};
