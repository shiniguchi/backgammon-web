'use client';

import { useState } from 'react';

interface SetupModalProps {
  onStart: (whiteName: string, blackName: string) => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ onStart }) => {
  const [whiteName, setWhiteName] = useState('Player 1');
  const [blackName, setBlackName] = useState('Player 2');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(whiteName || 'Player 1', blackName || 'Player 2');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-panel rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Title */}
          <h2 className="text-3xl font-bold text-amber-400 mb-2 text-center title-glow tracking-wider">
            BACKGAMMON
          </h2>
          <p className="text-gray-400 text-center mb-8">Enter player names to begin</p>

          <form onSubmit={handleSubmit}>
            {/* White player input */}
            <div className="mb-5">
              <label className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full checker-white" />
                <span className="text-white font-medium">White Player</span>
              </label>
              <input
                type="text"
                value={whiteName}
                onChange={(e) => setWhiteName(e.target.value)}
                placeholder="Enter name"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* Black player input */}
            <div className="mb-8">
              <label className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full checker-black" />
                <span className="text-white font-medium">Black Player</span>
              </label>
              <input
                type="text"
                value={blackName}
                onChange={(e) => setBlackName(e.target.value)}
                placeholder="Enter name"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* Start button */}
            <button
              type="submit"
              className="w-full btn-neon px-6 py-4 rounded-xl font-bold text-lg tracking-wide transition-all duration-300"
            >
              Start Game
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Higher opening roll goes first
          </p>
        </div>
      </div>
    </div>
  );
};
