'use client';

import { GameState, PlayerColor } from '@/game/types';

interface GameOverModalProps {
  state: GameState;
  onNewGame: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  onNewGame,
  onClose,
}) => {
  const { winner, winType, stakes, players } = state;

  if (!winner) return null;

  const winnerName = players[winner].name;
  const loserName = players[winner === 'white' ? 'black' : 'white'].name;

  const getWinTypeLabel = () => {
    switch (winType) {
      case 'gammon':
        return 'GAMMON!';
      case 'backgammon':
        return 'BACKGAMMON!';
      default:
        return 'VICTORY!';
    }
  };

  const getWinTypeDescription = () => {
    switch (winType) {
      case 'gammon':
        return `${loserName} didn't bear off any checkers`;
      case 'backgammon':
        return `${loserName} has checkers on bar or in opponent's home`;
      default:
        return 'Standard win';
    }
  };

  const getStakesColor = () => {
    switch (winType) {
      case 'gammon':
        return 'from-yellow-400 to-amber-500';
      case 'backgammon':
        return 'from-purple-400 to-pink-500';
      default:
        return 'from-cyan-400 to-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-panel rounded-2xl p-8 max-w-md w-full mx-4 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />

        {/* Confetti-like particles */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
        <div className="absolute top-20 right-20 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-20 left-20 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.25s' }} />

        <div className="relative z-10">
          {/* Winner indicator */}
          <div className="mb-6">
            <div className="relative inline-block">
              <div
                className={`
                  w-20 h-20 rounded-full mx-auto mb-4
                  ${winner === 'white' ? 'checker-white' : 'checker-black'}
                `}
              />
              {/* Glow ring */}
              <div
                className={`
                  absolute inset-0 rounded-full animate-ping
                  ${winner === 'white' ? 'bg-white/30' : 'bg-cyan-500/30'}
                `}
                style={{ animationDuration: '2s' }}
              />
            </div>

            {/* Win type badge */}
            <div className={`
              inline-block px-4 py-1 rounded-full text-sm font-bold mb-3
              bg-gradient-to-r ${getStakesColor()} text-white
              shadow-lg
            `}>
              {getWinTypeLabel()}
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              {winnerName} Wins!
            </h2>
            <div className="text-sm text-gray-400">
              {getWinTypeDescription()}
            </div>
          </div>

          {/* Stakes display */}
          <div className="glass-panel rounded-xl p-6 mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Final Stakes</div>
            <div className={`
              text-5xl font-bold bg-gradient-to-r ${getStakesColor()} bg-clip-text text-transparent
              drop-shadow-lg
            `}>
              {stakes}
            </div>
            <div className="text-sm text-gray-500 mt-1">points</div>
            {winType !== 'normal' && (
              <div className="text-xs text-amber-400 mt-2">
                {winType === 'gammon' ? '2x multiplier' : '3x multiplier'}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={onNewGame}
              className="flex-1 btn-neon-green px-6 py-3 rounded-xl font-bold transition-all duration-300"
            >
              New Game
            </button>
            <button
              onClick={onClose}
              className="flex-1 btn-neon px-6 py-3 rounded-xl font-bold transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
