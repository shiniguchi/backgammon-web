'use client';

import { useState } from 'react';
import { GameProvider, useGameContext } from '@/context/GameContext';
import { Board } from '@/components/Board';
import { PlayerPanel } from '@/components/PlayerPanel';
import { GameControls } from '@/components/GameControls';
import { DoublingCube } from '@/components/DoublingCube';
import { SetupModal } from '@/components/SetupModal';
import { GameOverModal } from '@/components/GameOverModal';

const GameContent: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const [showGameOver, setShowGameOver] = useState(true);

  const handleSetPlayers = (whiteName: string, blackName: string) => {
    dispatch({ type: 'SET_PLAYERS', white: whiteName, black: blackName });
  };

  const handleSelectPoint = (pointIndex: number) => {
    dispatch({ type: 'SELECT_POINT', pointIndex });
  };

  const handleRollDice = () => {
    dispatch({ type: 'ROLL_DICE' });
  };

  const handleUndoMove = () => {
    dispatch({ type: 'UNDO_MOVE' });
  };

  const handleUndoAll = () => {
    dispatch({ type: 'UNDO_ALL' });
  };

  const handleConfirmTurn = () => {
    dispatch({ type: 'CONFIRM_TURN' });
  };

  const handleOfferDouble = () => {
    dispatch({ type: 'OFFER_DOUBLE' });
  };

  const handleAcceptDouble = () => {
    dispatch({ type: 'ACCEPT_DOUBLE' });
  };

  const handleDeclineDouble = () => {
    dispatch({ type: 'DECLINE_DOUBLE' });
  };

  const handleNewGame = () => {
    dispatch({ type: 'NEW_GAME' });
    setShowGameOver(true);
  };

  const handleCloseGameOver = () => {
    setShowGameOver(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Mobile warning */}
      <div className="lg:hidden text-center p-8 glass-panel rounded-2xl mx-4">
        <h2 className="text-xl font-bold text-white mb-2">
          Please rotate your device
        </h2>
        <p className="text-gray-400">
          This game is best played in landscape mode on a larger screen.
        </p>
      </div>

      {/* Main game container */}
      <div className="hidden lg:block w-full max-w-6xl relative z-10">
        {/* Title */}
        <h1 className="text-4xl font-bold text-amber-400 text-center mb-8 title-glow tracking-wider">
          BACKGAMMON
        </h1>

        {/* Black player panel (top) */}
        <div className="mb-4">
          <PlayerPanel
            color="black"
            state={state}
            isCurrentTurn={state.currentPlayer === 'black' && state.phase === 'playing'}
          />
        </div>

        {/* Board and doubling cube */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex-1">
            <Board state={state} onSelectPoint={handleSelectPoint} />
          </div>
          <div className="w-20">
            <DoublingCube
              cube={state.doublingCube}
              currentPlayer={state.currentPlayer}
              phase={state.phase}
              onAccept={handleAcceptDouble}
              onDecline={handleDeclineDouble}
              playerNames={{
                white: state.players.white.name,
                black: state.players.black.name,
              }}
            />
          </div>
        </div>

        {/* White player panel (bottom) */}
        <div className="mb-6">
          <PlayerPanel
            color="white"
            state={state}
            isCurrentTurn={state.currentPlayer === 'white' && state.phase === 'playing'}
          />
        </div>

        {/* Game controls */}
        <GameControls
          state={state}
          onRollDice={handleRollDice}
          onUndoMove={handleUndoMove}
          onUndoAll={handleUndoAll}
          onConfirmTurn={handleConfirmTurn}
          onOfferDouble={handleOfferDouble}
        />
      </div>

      {/* Modals */}
      {state.phase === 'setup' && (
        <SetupModal onStart={handleSetPlayers} />
      )}

      {state.phase === 'game_over' && showGameOver && (
        <GameOverModal
          state={state}
          onNewGame={handleNewGame}
          onClose={handleCloseGameOver}
        />
      )}
    </div>
  );
};

export default function Home() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
