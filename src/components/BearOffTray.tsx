'use client';

import { PlayerColor } from '@/game/types';
import { BEAR_OFF_INDEX } from '@/game/constants';

interface BearOffTrayProps {
  color: PlayerColor;
  count: number;
  isValidTarget: boolean;
  onClick: () => void;
}

export const BearOffTray: React.FC<BearOffTrayProps> = ({
  color,
  count,
  isValidTarget,
  onClick,
}) => {
  return (
    <div
      className={`
        w-14 h-full flex flex-col items-center justify-center
        cursor-pointer transition-all duration-200
        ${isValidTarget ? 'valid-target' : ''}
      `}
      onClick={onClick}
    >
      {/* Borne off checkers representation */}
      <div className="flex flex-col items-center gap-2">
        {count > 0 ? (
          <>
            {/* Stack visualization */}
            <div className="relative">
              {[...Array(Math.min(count, 5))].map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-10 h-3 rounded-sm
                    ${color === 'white'
                      ? 'bg-gradient-to-b from-white to-gray-200 border border-gray-300'
                      : 'bg-gradient-to-b from-gray-700 to-gray-900 border border-gray-800'
                    }
                  `}
                  style={{
                    marginTop: i > 0 ? '-2px' : '0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              ))}
              {/* Count overlay */}
              <div
                className={`
                  absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center
                  text-xs font-bold shadow-lg
                  ${color === 'white'
                    ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                    : 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                  }
                `}
              >
                {count}
              </div>
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Off</span>
          </>
        ) : (
          <div className="text-gray-600/30 text-xs uppercase tracking-wider">
            Bear Off
          </div>
        )}
      </div>
    </div>
  );
};
