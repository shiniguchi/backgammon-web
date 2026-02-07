'use client';

import { DoublingCubeState, PlayerColor } from '@/game/types';

interface DoublingCubeProps {
  cube: DoublingCubeState;
  currentPlayer: PlayerColor;
  phase: string;
  onAccept: () => void;
  onDecline: () => void;
  playerNames: Record<PlayerColor, string>;
}

export const DoublingCube: React.FC<DoublingCubeProps> = ({
  cube,
  currentPlayer,
  phase,
  onAccept,
  onDecline,
  playerNames,
}) => {
  // Position based on owner
  const getPosition = () => {
    if (cube.owner === null) return 'center';
    return cube.owner;
  };

  const position = getPosition();

  return (
    <div className="relative flex flex-col items-center h-full justify-center">
      {/* Label */}
      <div className="text-xs text-amber-400/60 uppercase tracking-wider mb-2 font-semibold">
        Stakes
      </div>

      {/* Cube display */}
      <div
        className={`
          doubling-cube w-14 h-14 rounded-lg flex items-center justify-center
          text-amber-400 font-bold text-2xl
          ${position === 'white' ? 'translate-y-8' : ''}
          ${position === 'black' ? '-translate-y-8' : ''}
          transition-transform duration-500
        `}
      >
        <span className="drop-shadow-lg">{cube.value}</span>
      </div>

      {/* Owner indicator */}
      {cube.owner && (
        <div className="text-xs text-gray-500 mt-2">
          {playerNames[cube.owner]}
        </div>
      )}

      {/* Doubling offered modal */}
      {phase === 'doubling_offered' && cube.offered && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel rounded-2xl p-8 max-w-md mx-4 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-amber-400 text-5xl mb-3">
                {cube.value} → {cube.value * 2}
              </div>
              <h3 className="text-2xl font-bold text-white">Double Offered!</h3>
            </div>

            {/* Message */}
            <p className="text-gray-300 text-center mb-2">
              <span className="text-cyan-400 font-semibold">{playerNames[cube.offeredBy!]}</span> offers to double the stakes.
            </p>
            <p className="text-gray-400 text-center mb-8">
              <span className="text-white font-semibold">{playerNames[cube.offeredBy === 'white' ? 'black' : 'white']}</span>, do you accept?
            </p>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={onAccept}
                className="flex-1 btn-neon-green px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300"
              >
                Accept
              </button>
              <button
                onClick={onDecline}
                className="flex-1 btn-neon-red px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300"
              >
                Decline
              </button>
            </div>

            {/* Warning text */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Declining forfeits the game at current stakes ({cube.value})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
