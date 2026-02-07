'use client';

import { PlayerColor } from '@/game/types';

interface CheckerProps {
  color: PlayerColor;
  isSelected?: boolean;
  isTopOfStack?: boolean;
  onClick?: () => void;
  stackIndex?: number;
  totalInStack?: number;
}

export const Checker: React.FC<CheckerProps> = ({
  color,
  isSelected = false,
  isTopOfStack = true,
  onClick,
  stackIndex = 0,
  totalInStack = 1,
}) => {
  // Calculate vertical offset based on stack position
  const maxVisibleCheckers = 5;
  const overlap = totalInStack > maxVisibleCheckers ? 7 : 9;
  const topOffset = stackIndex * overlap;

  return (
    <div
      className={`
        absolute w-11 h-11 rounded-full transition-all duration-200
        ${isSelected ? 'checker-selected scale-110 z-50' : ''}
        ${isTopOfStack && onClick ? 'cursor-pointer hover:scale-105 hover:brightness-110' : ''}
      `}
      style={{
        top: `${topOffset}px`,
        left: '50%',
        transform: `translateX(-50%)`,
        zIndex: isSelected ? 50 : stackIndex + 1,
        background: color === 'white'
          ? 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f5f5f5 30%, #d0d0d0 60%, #a8a8a8 100%)'
          : 'radial-gradient(circle at 35% 35%, #505050 0%, #353535 30%, #202020 60%, #0a0a0a 100%)',
        boxShadow: isSelected
          ? `0 0 25px rgba(0, 212, 255, 0.9), 0 0 50px rgba(0, 212, 255, 0.5), inset 0 2px 4px ${color === 'white' ? 'rgba(255,255,255,0.8)' : 'rgba(100,100,100,0.3)'}, inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)`
          : `inset 0 2px 4px ${color === 'white' ? 'rgba(255,255,255,0.8)' : 'rgba(100,100,100,0.3)'}, inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)`,
        border: color === 'white' ? '2px solid #c0c0c0' : '2px solid #1a1a1a',
      }}
      onClick={isTopOfStack && onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
    >
      {/* Inner decorative ring */}
      <div
        className="absolute rounded-full"
        style={{
          top: '15%',
          left: '15%',
          right: '15%',
          bottom: '15%',
          border: color === 'white' ? '1px solid rgba(180,180,180,0.5)' : '1px solid rgba(60,60,60,0.5)',
        }}
      />
      {/* Shine highlight */}
      <div
        className="absolute rounded-full"
        style={{
          top: '10%',
          left: '15%',
          width: '30%',
          height: '25%',
          background: color === 'white'
            ? 'radial-gradient(ellipse, rgba(255,255,255,0.9) 0%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(255,255,255,0.15) 0%, transparent 70%)',
        }}
      />
      {/* Show count badge if stacking more than max visible */}
      {isTopOfStack && totalInStack > maxVisibleCheckers && (
        <div
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-50"
          style={{
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0, 212, 255, 0.5)',
          }}
        >
          {totalInStack}
        </div>
      )}
    </div>
  );
};
