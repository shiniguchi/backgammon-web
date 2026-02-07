'use client';

import { useState, useEffect } from 'react';

interface DiceProps {
  values: [number, number];
  remaining: number[];
  isRolling?: boolean;
}

const DieFace: React.FC<{ value: number; isUsed: boolean; isRolling?: boolean; delay?: number }> = ({
  value,
  isUsed,
  isRolling = false,
  delay = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setAnimating(true);
      // Randomize display during roll
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 50);

      // Stop and show final value
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setDisplayValue(value);
        setTimeout(() => setAnimating(false), 100);
      }, 600 + delay);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setDisplayValue(value);
    }
  }, [isRolling, value, delay]);

  // Pip positions for each die face
  const pipPositions: Record<number, Array<{ x: number; y: number }>> = {
    1: [{ x: 50, y: 50 }],
    2: [{ x: 28, y: 28 }, { x: 72, y: 72 }],
    3: [{ x: 28, y: 28 }, { x: 50, y: 50 }, { x: 72, y: 72 }],
    4: [{ x: 28, y: 28 }, { x: 72, y: 28 }, { x: 28, y: 72 }, { x: 72, y: 72 }],
    5: [{ x: 28, y: 28 }, { x: 72, y: 28 }, { x: 50, y: 50 }, { x: 28, y: 72 }, { x: 72, y: 72 }],
    6: [{ x: 28, y: 25 }, { x: 28, y: 50 }, { x: 28, y: 75 }, { x: 72, y: 25 }, { x: 72, y: 50 }, { x: 72, y: 75 }],
  };

  const pips = pipPositions[displayValue] || [];

  return (
    <div
      className={`
        relative w-14 h-14 die-face
        ${animating ? 'dice-rolling' : ''}
        ${isUsed ? 'opacity-40 grayscale' : ''}
        transition-all duration-300
      `}
      style={{
        transformStyle: 'preserve-3d',
        transform: animating ? undefined : 'rotateX(0deg)',
      }}
    >
      {pips.map((pos, i) => (
        <div
          key={i}
          className="die-pip absolute w-2.5 h-2.5 rounded-full"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      {/* Used die overlay */}
      {isUsed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-0.5 bg-red-500/80 rotate-45 shadow-lg shadow-red-500/50" />
        </div>
      )}
    </div>
  );
};

export const Dice: React.FC<DiceProps> = ({ values, remaining, isRolling = false }) => {
  const [die1, die2] = values;

  // Count how many of each die value remain
  const die1Remaining = remaining.filter((d) => d === die1).length;
  const die2Remaining = remaining.filter((d) => d === die2).length;

  // For doubles, show usage more clearly
  const isDoubles = die1 === die2;

  if (values[0] === 0 && values[1] === 0) {
    return (
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-600/50 flex items-center justify-center text-gray-500 text-2xl">
          ?
        </div>
        <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-600/50 flex items-center justify-center text-gray-500 text-2xl">
          ?
        </div>
      </div>
    );
  }

  if (isDoubles) {
    // Show 4 dice for doubles
    const totalUsed = 4 - remaining.length;
    return (
      <div className="flex items-center gap-3 dice-3d">
        {[0, 1, 2, 3].map((i) => (
          <DieFace
            key={i}
            value={die1}
            isUsed={i < totalUsed}
            isRolling={isRolling}
            delay={i * 100}
          />
        ))}
      </div>
    );
  }

  // Regular roll - show 2 dice
  const die1Used = die1Remaining === 0;
  const die2Used = die2Remaining === 0;

  return (
    <div className="flex items-center gap-4 dice-3d">
      <DieFace value={die1} isUsed={die1Used} isRolling={isRolling} delay={0} />
      <DieFace value={die2} isUsed={die2Used} isRolling={isRolling} delay={150} />
    </div>
  );
};
