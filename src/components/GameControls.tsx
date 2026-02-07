'use client';

import { useState } from 'react';
import { GameState } from '@/game/types';
import { canOfferDouble } from '@/game/doublingCube';
import { hasLegalMoves } from '@/game/moves';
import { Dice } from './Dice';

interface GameControlsProps {
  state: GameState;
  onRollDice: () => void;
  onUndoMove: () => void;
  onUndoAll: () => void;
  onConfirmTurn: () => void;
  onOfferDouble: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  state,
  onRollDice,
  onUndoMove,
  onUndoAll,
  onConfirmTurn,
  onOfferDouble,
}) => {
  const { dice, phase, currentPlayer, doublingCube, moveHistory } = state;
  const [isRolling, setIsRolling] = useState(false);

  const showDouble = phase === 'playing' && !dice.rolled && canOfferDouble(doublingCube, currentPlayer);
  const showRoll = phase === 'playing' && !dice.rolled;
  const showUndo = dice.rolled && moveHistory.length > 0;
  const canConfirm = dice.rolled && (dice.remaining.length === 0 || !hasLegalMoves(state));

  const handleRoll = () => {
    setIsRolling(true);
    setTimeout(() => {
      onRollDice();
      setTimeout(() => setIsRolling(false), 700);
    }, 100);
  };

  return (
    <div className="glass-panel rounded-xl p-6">
      {/* Dice display */}
      <div className="flex justify-center mb-4">
        <Dice values={dice.values} remaining={dice.remaining} isRolling={isRolling} />
      </div>

      {/* Message display */}
      {state.message && (
        <div className="text-sm text-amber-300 bg-amber-900/30 border border-amber-500/30 px-4 py-2 rounded-lg mb-4 text-center">
          {state.message}
        </div>
      )}

      {/* Control buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {showDouble && (
          <button
            onClick={onOfferDouble}
            className="btn-neon-purple px-5 py-2.5 rounded-lg font-semibold tracking-wide transition-all duration-300"
          >
            Double ({doublingCube.value} → {doublingCube.value * 2})
          </button>
        )}

        {showRoll && (
          <button
            onClick={handleRoll}
            disabled={isRolling}
            className={`
              btn-neon px-8 py-3 rounded-lg font-bold text-lg tracking-wide transition-all duration-300
              ${isRolling ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </button>
        )}

        {showUndo && (
          <>
            <button
              onClick={onUndoMove}
              className="btn-neon-red px-5 py-2.5 rounded-lg font-semibold tracking-wide transition-all duration-300"
            >
              Undo Move
            </button>
            <button
              onClick={onUndoAll}
              className="btn-neon-red px-5 py-2.5 rounded-lg font-semibold tracking-wide transition-all duration-300"
            >
              Undo All
            </button>
          </>
        )}

        {canConfirm && (
          <button
            onClick={onConfirmTurn}
            className="btn-neon-green px-8 py-3 rounded-lg font-bold text-lg tracking-wide transition-all duration-300"
          >
            Confirm Turn
          </button>
        )}
      </div>
    </div>
  );
};
