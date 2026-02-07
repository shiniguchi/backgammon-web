'use client';

import { GameState } from '@/game/types';
import { Point } from './Point';
import { Bar } from './Bar';
import { BearOffTray } from './BearOffTray';
import { getPointIndices } from '@/utils/boardHelpers';
import { BAR_INDEX, BEAR_OFF_INDEX } from '@/game/constants';
import { getValidSourcePoints } from '@/game/moves';

interface BoardProps {
  state: GameState;
  onSelectPoint: (index: number) => void;
}

export const Board: React.FC<BoardProps> = ({ state, onSelectPoint }) => {
  const { board, selectedPoint, validMoves, currentPlayer, bar, borneOff, dice, phase } = state;

  const validSources = dice.rolled && phase === 'playing' ? getValidSourcePoints(state) : [];
  const isBarValidSource = validSources.includes(BAR_INDEX);

  // Get point indices for each quadrant
  const topLeftPoints = getPointIndices('top', 'left');
  const topRightPoints = getPointIndices('top', 'right');
  const bottomLeftPoints = getPointIndices('bottom', 'left');
  const bottomRightPoints = getPointIndices('bottom', 'right');

  const renderPoint = (index: number, direction: 'up' | 'down') => (
    <Point
      key={index}
      index={index}
      state={board[index]}
      isSelected={selectedPoint === index}
      isValidTarget={validMoves.includes(index)}
      isValidSource={validSources.includes(index)}
      onClick={() => onSelectPoint(index)}
      direction={direction}
    />
  );

  return (
    <div className="wood-frame rounded-xl p-3 overflow-hidden">
      {/* Inner felt/playing surface */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1a3a1a 0%, #0d2a0d 50%, #1a3a1a 100%)',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Main board container */}
        <div className="flex h-[420px]">
          {/* Left quadrant */}
          <div className="flex-1 flex flex-col">
            {/* Top row (points 13-18) */}
            <div className="flex-1 flex px-2 pt-8">
              {topLeftPoints.map((i) => renderPoint(i, 'down'))}
            </div>
            {/* Bottom row (points 12-7) */}
            <div className="flex-1 flex px-2 pb-8">
              {bottomLeftPoints.map((i) => renderPoint(i, 'up'))}
            </div>
          </div>

          {/* Bar */}
          <Bar
            whiteCount={bar.white}
            blackCount={bar.black}
            selectedPoint={selectedPoint}
            currentPlayer={currentPlayer}
            isValidSource={isBarValidSource}
            onClickWhite={() => onSelectPoint(BAR_INDEX)}
            onClickBlack={() => onSelectPoint(BAR_INDEX)}
          />

          {/* Right quadrant */}
          <div className="flex-1 flex flex-col">
            {/* Top row (points 19-24) - Black's home */}
            <div className="flex-1 flex px-2 pt-8">
              {topRightPoints.map((i) => renderPoint(i, 'down'))}
            </div>
            {/* Bottom row (points 6-1) - White's home */}
            <div className="flex-1 flex px-2 pb-8">
              {bottomRightPoints.map((i) => renderPoint(i, 'up'))}
            </div>
          </div>

          {/* Bear-off trays */}
          <div className="flex flex-col bear-off-tray">
            {/* Black's bear-off (top) */}
            <div className="flex-1">
              <BearOffTray
                color="black"
                count={borneOff.black}
                isValidTarget={currentPlayer === 'black' && validMoves.includes(BEAR_OFF_INDEX)}
                onClick={() => onSelectPoint(BEAR_OFF_INDEX)}
              />
            </div>
            {/* White's bear-off (bottom) */}
            <div className="flex-1">
              <BearOffTray
                color="white"
                count={borneOff.white}
                isValidTarget={currentPlayer === 'white' && validMoves.includes(BEAR_OFF_INDEX)}
                onClick={() => onSelectPoint(BEAR_OFF_INDEX)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
