import { GameState, GameAction, PlayerColor, MoveRecord } from './types';
import { createInitialState, createTurnSnapshot, cloneBoard } from './state';
import { rollDie, rollDice, getDiceRemaining, removeDieFromRemaining } from './dice';
import { applyMove, getValidDestinationsForPoint, hasLegalMoves, getValidSourcePoints } from './moves';
import { checkWinner, getWinType, getStakesMultiplier } from './rules';
import { canOfferDouble, offerDouble, acceptDouble } from './doublingCube';
import { getOpponent, BAR_INDEX } from './constants';

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_PLAYERS': {
      // Set player names and do opening roll
      const whiteRoll = rollDie();
      let blackRoll = rollDie();

      // Re-roll if tied
      while (whiteRoll === blackRoll) {
        blackRoll = rollDie();
      }

      const firstPlayer: PlayerColor = whiteRoll > blackRoll ? 'white' : 'black';
      const diceValues: [number, number] = [whiteRoll, blackRoll];

      return {
        ...state,
        phase: 'playing',
        players: {
          white: { name: action.white || 'Player 1' },
          black: { name: action.black || 'Player 2' },
        },
        currentPlayer: firstPlayer,
        openingRoll: { white: whiteRoll, black: blackRoll },
        dice: {
          values: diceValues,
          remaining: getDiceRemaining(diceValues),
          rolled: true,
        },
        turnSnapshot: createTurnSnapshot({
          ...state,
          dice: {
            values: diceValues,
            remaining: getDiceRemaining(diceValues),
            rolled: true,
          },
        }),
        message: `${action.white || 'Player 1'} rolled ${whiteRoll}, ${action.black || 'Player 2'} rolled ${blackRoll}. ${firstPlayer === 'white' ? action.white || 'Player 1' : action.black || 'Player 2'} goes first!`,
      };
    }

    case 'ROLL_DICE': {
      if (state.dice.rolled || state.phase !== 'playing') {
        return state;
      }

      const values = rollDice();
      const remaining = getDiceRemaining(values);

      const newState: GameState = {
        ...state,
        dice: {
          values,
          remaining,
          rolled: true,
        },
        turnSnapshot: createTurnSnapshot(state),
        message: null,
      };

      // Check if player has any legal moves
      if (!hasLegalMoves(newState)) {
        return {
          ...newState,
          message: 'No legal moves available. Turn will be skipped.',
          dice: {
            ...newState.dice,
            remaining: [],
          },
        };
      }

      return newState;
    }

    case 'SELECT_POINT': {
      if (!state.dice.rolled || state.phase !== 'playing') {
        return state;
      }

      const pointIndex = action.pointIndex;

      // Check if clicking on the same point (deselect)
      if (state.selectedPoint === pointIndex) {
        return {
          ...state,
          selectedPoint: null,
          validMoves: [],
        };
      }

      // Check if clicking on a valid destination
      if (state.selectedPoint !== null && state.validMoves.includes(pointIndex)) {
        // This is a move, not a selection
        // Find the die value used for this move
        const from = state.selectedPoint;
        const to = pointIndex;
        let dieValue: number | null = null;

        if (from === BAR_INDEX) {
          // Moving from bar
          const opponent = state.currentPlayer === 'white' ? 'black' : 'white';
          if (state.currentPlayer === 'white') {
            dieValue = 24 - to;
          } else {
            dieValue = to + 1;
          }
        } else if (to === 25) {
          // Bearing off - find matching die
          const distance = state.currentPlayer === 'white' ? from + 1 : 24 - from;
          // Find exact match first, then overshoot
          if (state.dice.remaining.includes(distance)) {
            dieValue = distance;
          } else {
            // Find smallest die that's larger than distance
            const largerDice = state.dice.remaining.filter((d) => d > distance).sort((a, b) => a - b);
            if (largerDice.length > 0) {
              dieValue = largerDice[0];
            }
          }
        } else {
          // Regular move
          dieValue = Math.abs(to - from);
        }

        if (dieValue && state.dice.remaining.includes(dieValue)) {
          return gameReducer(state, {
            type: 'MOVE_CHECKER',
            from,
            to,
            dieValue,
          });
        }
      }

      // Try to select a new point
      const validSources = getValidSourcePoints(state);

      if (!validSources.includes(pointIndex)) {
        return {
          ...state,
          selectedPoint: null,
          validMoves: [],
        };
      }

      // Select this point and compute valid destinations
      const validDests = getValidDestinationsForPoint(state, pointIndex);

      return {
        ...state,
        selectedPoint: pointIndex,
        validMoves: validDests,
      };
    }

    case 'MOVE_CHECKER': {
      const { from, to, dieValue } = action;

      if (!state.dice.remaining.includes(dieValue)) {
        return state;
      }

      const result = applyMove(
        state.board,
        state.bar,
        state.borneOff,
        state.currentPlayer,
        from,
        to
      );

      const moveRecord: MoveRecord = {
        from,
        to,
        dieValue,
        hitOpponent: result.hitOpponent,
      };

      const newRemaining = removeDieFromRemaining(state.dice.remaining, dieValue);

      let newState: GameState = {
        ...state,
        board: result.board,
        bar: result.bar,
        borneOff: result.borneOff,
        dice: {
          ...state.dice,
          remaining: newRemaining,
        },
        selectedPoint: null,
        validMoves: [],
        moveHistory: [...state.moveHistory, moveRecord],
        message: null,
      };

      // Check for winner
      const winner = checkWinner(newState);
      if (winner) {
        const winType = getWinType(newState, winner);
        const multiplier = getStakesMultiplier(winType);
        return {
          ...newState,
          phase: 'game_over',
          winner,
          winType,
          stakes: state.doublingCube.value * multiplier,
        };
      }

      // Check if there are more legal moves
      if (newRemaining.length > 0 && !hasLegalMoves(newState)) {
        newState = {
          ...newState,
          dice: {
            ...newState.dice,
            remaining: [],
          },
          message: 'No more legal moves available.',
        };
      }

      return newState;
    }

    case 'UNDO_MOVE': {
      if (state.moveHistory.length === 0) {
        return state;
      }

      const lastMove = state.moveHistory[state.moveHistory.length - 1];
      const newBoard = cloneBoard(state.board);
      const newBar = { ...state.bar };
      const newBorneOff = { ...state.borneOff };
      const opponent = getOpponent(state.currentPlayer);

      // Reverse the move
      // Remove checker from destination
      if (lastMove.to === 25) {
        // Was borne off
        newBorneOff[state.currentPlayer]--;
      } else {
        newBoard[lastMove.to].count--;
        if (newBoard[lastMove.to].count === 0) {
          newBoard[lastMove.to].color = null;
        }
      }

      // Add checker back to source
      if (lastMove.from === BAR_INDEX) {
        newBar[state.currentPlayer]++;
      } else {
        newBoard[lastMove.from].count++;
        newBoard[lastMove.from].color = state.currentPlayer;
      }

      // Un-hit opponent if necessary
      if (lastMove.hitOpponent && lastMove.to !== 25) {
        newBoard[lastMove.to].count = 1;
        newBoard[lastMove.to].color = opponent;
        newBar[opponent]--;
      }

      // Restore the die
      const newRemaining = [...state.dice.remaining, lastMove.dieValue];

      return {
        ...state,
        board: newBoard,
        bar: newBar,
        borneOff: newBorneOff,
        dice: {
          ...state.dice,
          remaining: newRemaining,
        },
        moveHistory: state.moveHistory.slice(0, -1),
        selectedPoint: null,
        validMoves: [],
        message: null,
      };
    }

    case 'UNDO_ALL': {
      if (!state.turnSnapshot) {
        return state;
      }

      return {
        ...state,
        board: state.turnSnapshot.board.map((p) => ({ ...p })),
        bar: { ...state.turnSnapshot.bar },
        borneOff: { ...state.turnSnapshot.borneOff },
        dice: {
          ...state.dice,
          remaining: [...state.turnSnapshot.diceRemaining],
        },
        moveHistory: [],
        selectedPoint: null,
        validMoves: [],
        message: null,
      };
    }

    case 'CONFIRM_TURN': {
      // Can only confirm if no remaining moves
      if (state.dice.remaining.length > 0 && hasLegalMoves(state)) {
        return state;
      }

      const nextPlayer = getOpponent(state.currentPlayer);

      return {
        ...state,
        currentPlayer: nextPlayer,
        dice: {
          values: [0, 0],
          remaining: [],
          rolled: false,
        },
        selectedPoint: null,
        validMoves: [],
        moveHistory: [],
        turnSnapshot: null,
        openingRoll: null,
        message: null,
      };
    }

    case 'OFFER_DOUBLE': {
      if (!canOfferDouble(state.doublingCube, state.currentPlayer)) {
        return state;
      }

      if (state.dice.rolled) {
        return state; // Can only double before rolling
      }

      return {
        ...state,
        phase: 'doubling_offered',
        doublingCube: offerDouble(state.doublingCube, state.currentPlayer),
      };
    }

    case 'ACCEPT_DOUBLE': {
      if (state.phase !== 'doubling_offered') {
        return state;
      }

      return {
        ...state,
        phase: 'playing',
        doublingCube: acceptDouble(state.doublingCube),
      };
    }

    case 'DECLINE_DOUBLE': {
      if (state.phase !== 'doubling_offered') {
        return state;
      }

      const winner = state.doublingCube.offeredBy!;

      return {
        ...state,
        phase: 'game_over',
        winner,
        winType: 'normal',
        stakes: state.doublingCube.value,
      };
    }

    case 'NEW_GAME': {
      return {
        ...createInitialState(),
        players: state.players,
        phase: 'setup',
      };
    }

    case 'CLEAR_MESSAGE': {
      return {
        ...state,
        message: null,
      };
    }

    default:
      return state;
  }
};
