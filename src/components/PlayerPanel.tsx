'use client';

import { PlayerColor, GameState } from '@/game/types';
import { calculatePipCount } from '@/utils/pipCount';

interface PlayerPanelProps {
  color: PlayerColor;
  state: GameState;
  isCurrentTurn: boolean;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  color,
  state,
  isCurrentTurn,
}) => {
  const playerName = state.players[color].name;
  const pipCount = calculatePipCount(state, color);
  const borneOff = state.borneOff[color];
  const onBar = state.bar[color];

  return (
    <div
      className={`
        flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300
        ${isCurrentTurn
          ? 'glass-panel-active'
          : 'glass-panel'
        }
      `}
    >
      {/* Player color indicator with glow */}
      <div className="relative">
        <div
          className={`
            w-12 h-12 rounded-full transition-all duration-300
            ${isCurrentTurn ? 'scale-110' : ''}
          `}
          style={{
            background: color === 'white'
              ? 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f5f5f5 30%, #d0d0d0 60%, #a8a8a8 100%)'
              : 'radial-gradient(circle at 35% 35%, #505050 0%, #353535 30%, #202020 60%, #0a0a0a 100%)',
            boxShadow: `inset 0 2px 4px ${color === 'white' ? 'rgba(255,255,255,0.8)' : 'rgba(100,100,100,0.3)'}, inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)`,
            border: color === 'white' ? '2px solid #c0c0c0' : '2px solid #1a1a1a',
          }}
        />
        {isCurrentTurn && (
          <div
            className={`
              absolute inset-0 rounded-full animate-ping
              ${color === 'white' ? 'bg-white/30' : 'bg-cyan-500/30'}
            `}
            style={{ animationDuration: '2s' }}
          />
        )}
      </div>

      {/* Player info */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-white tracking-wide">{playerName}</span>
          {isCurrentTurn && (
            <span className="text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full font-semibold shadow-lg shadow-cyan-500/30">
              YOUR TURN
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-400">Pip count:</span>
          <span className="font-mono font-bold text-amber-400">{pipCount}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Off</div>
          <div className="font-mono font-bold text-2xl text-green-400 drop-shadow-lg">
            {borneOff}
          </div>
        </div>
        {onBar > 0 && (
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bar</div>
            <div className="font-mono font-bold text-2xl text-red-400 drop-shadow-lg animate-pulse">
              {onBar}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
