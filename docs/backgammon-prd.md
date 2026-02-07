# PRD: Backgammon Web App — Claude Code One-Shot Build

## Executive Summary

Build a fully functional, local-only backgammon web application using Next.js (React) + TypeScript. Two players share the same browser in hot-seat (turn-based) mode. The UI is clean, minimal, and flat. Interaction is click-to-move. The game implements standard backgammon rules with a doubling cube and undo-move functionality.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| State Management | React Context + useReducer |
| Canvas/Rendering | HTML/CSS (no canvas — pure DOM elements) |
| Package Manager | npm |
| Run Command | `npm run dev` → `localhost:3000` |

No backend. No database. No authentication. Everything runs client-side in a single browser tab.

---

## File & Directory Structure

```
backgammon/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with font + metadata
│   │   ├── page.tsx            # Main game page
│   │   └── globals.css         # Tailwind imports + custom CSS vars
│   ├── components/
│   │   ├── Board.tsx           # Main board container (renders points, bar, bear-off)
│   │   ├── Point.tsx           # Single triangle/point with checkers
│   │   ├── Checker.tsx         # Individual checker piece
│   │   ├── Bar.tsx             # Center bar showing hit checkers
│   │   ├── BearOffTray.tsx     # Bear-off area for each player
│   │   ├── Dice.tsx            # Dice display component
│   │   ├── DoublingCube.tsx    # Doubling cube display + controls
│   │   ├── PlayerPanel.tsx     # Player info, name, pip count, turn indicator
│   │   ├── GameControls.tsx    # Roll dice, undo, confirm move, new game buttons
│   │   ├── GameOverModal.tsx   # End-of-game modal with winner + score
│   │   └── SetupModal.tsx      # Pre-game modal for player names
│   ├── game/
│   │   ├── types.ts            # All TypeScript interfaces and types
│   │   ├── constants.ts        # Board setup, colors, point count
│   │   ├── state.ts            # GameState interface + initial state factory
│   │   ├── reducer.ts          # Game reducer (all state transitions)
│   │   ├── moves.ts            # Move generation + validation logic
│   │   ├── rules.ts            # Win detection, bearing-off eligibility, hit logic
│   │   ├── dice.ts             # Dice rolling, doubles handling
│   │   └── doublingCube.ts     # Doubling cube logic (offer, accept, decline)
│   ├── context/
│   │   └── GameContext.tsx      # React Context provider wrapping the reducer
│   ├── hooks/
│   │   ├── useGame.ts          # Hook to consume GameContext
│   │   └── useValidMoves.ts    # Hook that computes valid moves for selected checker
│   └── utils/
│       ├── boardHelpers.ts     # Point index math, direction helpers
│       └── pipCount.ts         # Pip count calculator
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── package.json
└── README.md
```

---

## Core Types (`game/types.ts`)

```typescript
export type PlayerColor = 'white' | 'black';

export interface CheckerPosition {
  pointIndex: number; // 0-23 for board, 24 = bar, 25 = borne-off
  color: PlayerColor;
}

export interface PointState {
  count: number;        // number of checkers on this point
  color: PlayerColor | null; // null if empty
}

export interface DiceState {
  values: [number, number];
  remaining: number[];  // remaining moves (4 entries for doubles)
  rolled: boolean;      // whether dice have been rolled this turn
}

export interface DoublingCubeState {
  value: number;           // 1, 2, 4, 8, 16, 32, 64
  owner: PlayerColor | null; // null = center (either can double), or the player who accepted
  offered: boolean;        // true when an offer is pending
  offeredBy: PlayerColor | null;
}

export interface MoveRecord {
  from: number;    // source point (24 = bar)
  to: number;      // dest point (25 = bear-off)
  dieValue: number;
  hitOpponent: boolean;
}

export interface TurnSnapshot {
  board: PointState[];
  bar: Record<PlayerColor, number>;
  borneOff: Record<PlayerColor, number>;
  diceRemaining: number[];
}

export type GamePhase = 'setup' | 'playing' | 'doubling_offered' | 'game_over';

export interface GameState {
  phase: GamePhase;
  board: PointState[];           // index 0-23
  bar: Record<PlayerColor, number>;
  borneOff: Record<PlayerColor, number>;
  currentPlayer: PlayerColor;
  dice: DiceState;
  doublingCube: DoublingCubeState;
  selectedPoint: number | null;  // currently clicked checker's point
  validMoves: number[];          // valid destination points for selected checker
  moveHistory: MoveRecord[];     // moves in current turn (for undo)
  turnSnapshot: TurnSnapshot | null; // state at start of turn (for full undo)
  winner: PlayerColor | null;
  winType: 'normal' | 'gammon' | 'backgammon' | null;
  players: Record<PlayerColor, { name: string }>;
  stakes: number;                // doublingCube.value at game end
}
```

---

## Game Constants (`game/constants.ts`)

### Initial Board Setup

Standard backgammon starting position. Points are indexed 0–23.

- **White** moves from point 23 → 0 (bearing off past point 0).
- **Black** moves from point 0 → 23 (bearing off past point 23).

```
Point Index:  [0]  [1]  [2]  [3]  [4]  [5]  [6]  [7]  [8]  [9] [10] [11] [12] [13] [14] [15] [16] [17] [18] [19] [20] [21] [22] [23]
White:         2    0    0    0    0    0    0    0    0    0    0    5    0    0    0    0    3    0    5    0    0    0    0    0
Black:         0    0    0    0    0    5    0    3    0    0    0    0    5    0    0    0    0    0    0    0    0    0    0    2
```

This maps to the standard setup:
- White: 2 on point 0 (opponent's 1-point), 5 on point 11 (opponent's 12-point), 3 on point 16 (own 8-point), 5 on point 18 (own 6-point)
- Black: 2 on point 23, 5 on point 12, 3 on point 7, 5 on point 5

### Colors (Tailwind classes)

| Element | Color |
|---------|-------|
| Board background | `bg-stone-100` |
| Dark triangles | `bg-stone-700` |
| Light triangles | `bg-stone-300` |
| White checkers | `bg-white border border-stone-400` |
| Black checkers | `bg-stone-800` |
| Selected checker highlight | `ring-2 ring-blue-500` |
| Valid move indicator | `ring-2 ring-green-400` |
| Bar | `bg-stone-500` |
| Bear-off tray | `bg-stone-200` |

---

## Game Logic Specification

### 1. Turn Flow

```
1. Start of turn:
   a. Save TurnSnapshot (for undo-all)
   b. If current player wants to double → offer doubling cube (optional)
   c. Player clicks "Roll Dice"
   d. Generate 2 random dice (1-6 each)
   e. If doubles → 4 moves available, else 2
   f. Compute all legal moves

2. Moving:
   a. Player clicks a checker (source point or bar)
   b. Highlight valid destinations based on remaining dice
   c. Player clicks destination → execute move
   d. Remove used die value from remaining
   e. If opponent checker on destination → hit it (move to bar)
   f. Repeat until no remaining dice or no legal moves
   g. If no legal moves available at any point → auto-skip remaining dice

3. End of turn:
   a. Player clicks "Confirm" (or auto-confirm if no moves remain)
   b. Check for win condition
   c. Switch currentPlayer
```

### 2. Move Validation (`game/moves.ts`)

A move from point `from` to point `to` is legal if:

1. **Bar first**: If the player has checkers on the bar, they MUST move from the bar first. No other moves are allowed until the bar is empty.
2. **Direction**: White moves from higher to lower index. Black moves from lower to higher index.
3. **Die match**: `|from - to|` must equal one of the remaining dice values. Exception: bearing off (see below).
4. **Destination open**: The destination point must have ≤1 opponent checker (if exactly 1, it's a hit).
5. **Bearing off**: Only allowed when ALL 15 of the player's checkers are in their home board (points 0–5 for white, points 18–23 for black).
   - Exact die: checker on point matching die value can bear off.
   - Overshoot: If no checker on the exact point, the die can bear off the furthest checker ONLY if there is no checker on a higher point (further from bear-off).
6. **Must use both dice if possible**. If only one die can be used, must use the larger one. If neither can be used, turn is forfeited. This is critical — the engine must enumerate all possible move sequences and ensure the player uses the maximum number of dice.

### Algorithm for Legal Move Generation

```
function getAllLegalMoveSequences(state, remainingDice):
  // Returns all possible complete sequences of moves
  // A sequence is "complete" when no more dice can be used
  
  sequences = []
  
  for each die in unique(remainingDice):
    for each possible move using that die:
      newState = applyMove(state, move)
      newRemaining = removeDie(remainingDice, die)
      subSequences = getAllLegalMoveSequences(newState, newRemaining)
      if subSequences is empty:
        sequences.push([move])
      else:
        for each sub in subSequences:
          sequences.push([move, ...sub])
  
  if sequences is empty:
    return [[]] // no moves possible
  
  // Filter: keep only sequences that use the maximum number of dice
  maxLen = max(sequences.map(s => s.length))
  sequences = sequences.filter(s => s.length === maxLen)
  
  // If maxLen is 1 and two different die values possible, keep only the higher die
  if maxLen === 1 and dice[0] !== dice[1]:
    higherDie = max(dice)
    higherSequences = sequences.filter(s => s[0].dieValue === higherDie)
    if higherSequences.length > 0:
      sequences = higherSequences
  
  return sequences
```

For the UI: when the player clicks a checker, compute valid immediate destinations from the current partial move state + remaining dice. But internally, validate that the chosen move doesn't lead to a dead end that prevents using the maximum number of dice.

### 3. Hit Logic

When a player lands on a point with exactly 1 opponent checker:
- Remove opponent checker from that point
- Place it on the bar (`bar[opponent] += 1`)
- The opponent must re-enter from the bar on their next turn

Re-entry from bar:
- White re-enters on points 18–23 (opponent's home board)
- Black re-enters on points 0–5 (opponent's home board)
- The die value determines the entry point: white enters at `25 - dieValue`, black enters at `dieValue - 1`

### 4. Bearing Off (`game/rules.ts`)

Conditions:
- All 15 checkers must be in home board (white: points 0–5, black: points 18–23)
- No checkers on bar

Exact bear-off: white on point `n` can bear off with die value `n + 1`. Black on point `n` can bear off with die value `24 - n`.

Overshoot rule: if no checker sits on the exact point for the die, bear off the checker on the highest-occupied point in the home board IF the die value is higher than that point's distance.

### 5. Win Detection

After each move, check:
- If `borneOff[player] === 15` → player wins
- **Normal win**: opponent has borne off ≥ 1 checker → stakes = cube value × 1
- **Gammon**: opponent has borne off 0 checkers → stakes = cube value × 2
- **Backgammon**: opponent has borne off 0 checkers AND has checkers on bar or in winner's home board → stakes = cube value × 3

### 6. Doubling Cube (`game/doublingCube.ts`)

Rules:
- Cube starts at center with value 1 (either player can offer)
- Before rolling dice, the current player MAY offer to double
- Opponent can **accept** (cube value doubles, opponent now "owns" the cube) or **decline** (current player wins at current cube value)
- Only the player who "owns" the cube (last accepted) can offer the next double
- Cube values: 1 → 2 → 4 → 8 → 16 → 32 → 64
- If cube is at center (game start), either player can offer

UI flow:
- Show "Double" button only when: it's current player's turn, dice haven't been rolled yet, and player is allowed to double (owns cube or cube is centered)
- On click → phase changes to `doubling_offered`
- Opponent sees "Accept" / "Decline" buttons
- Accept → cube doubles, owner switches, phase back to `playing`, current player rolls
- Decline → game over, offering player wins at previous cube value

### 7. Undo System

Two levels:
1. **Undo last move**: pops the last `MoveRecord` from `moveHistory`, reverses it (move checker back, un-hit if applicable, restore die to remaining)
2. **Undo all moves this turn**: restores `TurnSnapshot` completely, resets `moveHistory`, restores all dice to remaining

Undo is only available during the current turn before confirming. Once confirmed, the turn is final.

---

## UI/UX Specification

### Layout (Desktop-first, responsive)

```
┌──────────────────────────────────────────────────────┐
│  Player Panel (Black)         [Doubling Cube: 64]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [13][14][15][16][17][18] │BAR│ [19][20][21][22][23][BO]  │  ← Black's home board (right)
│                           │   │                      │
│  [12][11][10][ 9][ 8][ 7] │BAR│ [ 6][ 5][ 4][ 3][ 2][BO]  │  ← White's home board (right)
│                                                      │
├──────────────────────────────────────────────────────┤
│  Player Panel (White)                                │
├──────────────────────────────────────────────────────┤
│  [Roll Dice]  [Undo Move]  [Undo All]  [Confirm]    │
│                  🎲 3  🎲 5                          │
└──────────────────────────────────────────────────────┘
```

**Important layout note**: The board should be rendered with the standard backgammon orientation:
- Top row: points 13–24 (left to right)
- Bottom row: points 12–1 (left to right)
- Bar in the center dividing points 7-12 from 13-18
- Bear-off trays on the right side
- White sits at the bottom, Black sits at the top

### Board Component (`Board.tsx`)

- The board is a flex container with two halves (left quadrant + right quadrant) separated by the bar
- Each half contains a top row and bottom row of 6 points each
- Points are rendered as triangles using CSS (clip-path or border tricks)
- Top triangles point downward, bottom triangles point upward
- Alternating dark/light colors for triangles
- Point numbers displayed at edges

### Point Component (`Point.tsx`)

Props: `index`, `state (PointState)`, `isSelected`, `isValidTarget`, `onClick`, `direction ('up' | 'down')`

- Renders as a tall triangle with checkers stacked on it
- If >5 checkers, stack with overlap and show count badge
- If `isValidTarget`, show green highlight ring
- On click → dispatch select or move action

### Checker Component (`Checker.tsx`)

Props: `color`, `isSelected`, `isTopOfStack`

- Circular div, 40px diameter
- White: white fill with subtle border
- Black: dark fill
- Selected: blue ring
- Only the top checker of a stack is clickable

### Dice Component (`Dice.tsx`)

- Shows two dice with pip faces (dots, not numbers)
- Used dice are grayed out / crossed out
- Simple CSS grid for pip layout on each die face

### Game Controls (`GameControls.tsx`)

Buttons and their states:

| Button | Visible When | Enabled When |
|--------|-------------|-------------|
| Double | `phase === 'playing'`, dice not rolled, player can double | Always when visible |
| Roll Dice | `phase === 'playing'`, dice not rolled | Always when visible |
| Undo Move | Dice rolled, moveHistory.length > 0 | Always when visible |
| Undo All | Dice rolled, moveHistory.length > 0 | Always when visible |
| Confirm Turn | Dice rolled, no remaining legal moves OR player chose to confirm | When no legal moves remain |
| New Game | `phase === 'game_over'` | Always when visible |

### Doubling Cube UI (`DoublingCube.tsx`)

- Small square showing current value (number)
- Position: next to the player who owns it, or centered if no owner
- When `phase === 'doubling_offered'`: show modal/overlay with "Accept" and "Decline" buttons for the opponent

### Setup Modal (`SetupModal.tsx`)

- Appears on initial load
- Two text inputs: "Player 1 (White) name" and "Player 2 (Black) name"
- "Start Game" button
- Default names: "Player 1", "Player 2"

### Game Over Modal (`GameOverModal.tsx`)

- Shows winner name
- Shows win type (Normal / Gammon / Backgammon)
- Shows final stakes (cube value × multiplier)
- "New Game" and "Close" buttons

### Player Panel (`PlayerPanel.tsx`)

- Player name
- Pip count (total distance to bear off all checkers)
- Visual turn indicator (glow/highlight when it's their turn)
- Checkers borne off count

---

## State Management (`context/GameContext.tsx`)

Use `useReducer` with the following action types:

```typescript
type GameAction =
  | { type: 'SET_PLAYERS'; white: string; black: string }
  | { type: 'ROLL_DICE' }
  | { type: 'SELECT_POINT'; pointIndex: number }
  | { type: 'MOVE_CHECKER'; from: number; to: number; dieValue: number }
  | { type: 'UNDO_MOVE' }
  | { type: 'UNDO_ALL' }
  | { type: 'CONFIRM_TURN' }
  | { type: 'OFFER_DOUBLE' }
  | { type: 'ACCEPT_DOUBLE' }
  | { type: 'DECLINE_DOUBLE' }
  | { type: 'NEW_GAME' };
```

The reducer in `game/reducer.ts` handles all transitions. Each action must produce a new immutable state. No mutations.

---

## Pip Count (`utils/pipCount.ts`)

```
For white: sum of (pointIndex + 1) * checkers_on_point for all white checkers + 25 * bar_count
For black: sum of (24 - pointIndex) * checkers_on_point for all black checkers + 25 * bar_count
```

---

## Edge Cases to Handle

1. **No legal moves after roll**: Auto-skip turn, show message "No legal moves available"
2. **Partial moves**: If only 1 of 2 dice can be used, enforce using the higher die if both individually can be used but not both
3. **Doubles on bar**: If player has multiple checkers on bar and rolls doubles, they may re-enter up to 4 checkers
4. **Cannot re-enter from bar**: If all entry points are blocked, turn is forfeit
5. **Opening roll**: Both players roll one die each. Higher roll goes first using both dice as their first roll. If tied, re-roll. (Implement as: auto-roll for both, display result, higher goes first)
6. **Bearing off with no exact match**: Must move within home board if possible before bearing off with overshoot
7. **All checkers borne off simultaneously**: Unlikely but check after each individual move

---

## Opening Roll Implementation

1. On game start (after setup), auto-roll one die for each player
2. Display: "White rolled X, Black rolled Y"
3. If equal, re-roll
4. Higher roller goes first, using both dice values as their move
5. Note: doubles are impossible on opening roll (each player rolls 1 die)
6. Skip the "Roll Dice" step for the first turn — dice are already determined

---

## Styling Guidelines

- Font: system font stack (`font-sans` in Tailwind)
- Background: `bg-stone-50`
- Board border: `border-2 border-stone-400 rounded-lg`
- All interactive elements have `cursor-pointer` and hover states
- Transitions: `transition-all duration-150` on checker movements
- No shadows except subtle ones on checkers (`shadow-sm`)
- Responsive: minimum width 900px for desktop, show "rotate device" message on mobile portrait

---

## Implementation Order (for Claude Code)

1. Initialize Next.js project with TypeScript + Tailwind
2. Create `game/types.ts` and `game/constants.ts`
3. Implement `game/dice.ts` (simple random)
4. Implement `game/moves.ts` (move validation + legal move generation — THE HARDEST PART, get this right)
5. Implement `game/rules.ts` (bearing off, win detection, hit logic)
6. Implement `game/doublingCube.ts`
7. Implement `game/state.ts` + `game/reducer.ts`
8. Create `context/GameContext.tsx`
9. Build UI components bottom-up: Checker → Point → Bar → BearOffTray → Board → Dice → DoublingCube → PlayerPanel → GameControls → SetupModal → GameOverModal
10. Wire up `page.tsx` with all components
11. Test: opening roll, normal moves, hitting, bar re-entry, bearing off, doubling cube, undo, win conditions
12. Add `README.md` with run instructions

---

## README.md Content

```markdown
# Backgammon

Local two-player backgammon game.

## Run

npm install
npm run dev

Open http://localhost:3000

## Rules
Standard backgammon with doubling cube.

## Controls
- Click a checker to select it
- Click a highlighted point to move
- Use Undo to reverse moves before confirming
- Offer doubles before rolling dice
```

---

## Critical Implementation Notes for Claude Code

1. **Move validation is the most complex part.** The algorithm must explore all possible move sequences to ensure the "maximum dice usage" rule is enforced. Do NOT skip this — incorrect move validation breaks the game.
2. **Immutable state only.** Never mutate state in the reducer. Use spread operators or `structuredClone`.
3. **Point indexing consistency.** Pick one convention and stick with it everywhere: 0–23 for board points, 24 for bar, 25 for borne-off. Document it in constants.
4. **Test bearing off thoroughly.** The overshoot rule (bearing off with a die higher than the furthest checker) is a common source of bugs.
5. **Undo must be perfect.** Store `TurnSnapshot` at the start of each turn. Individual undo pops from `moveHistory` and reverses. Full undo restores snapshot.
6. **Do not use any external game library.** Implement all logic from scratch.
7. **All components must be client components** (`'use client'` directive) since we use React state/context extensively.
8. **The opening roll is a special case.** Handle it explicitly — don't try to fit it into the normal turn flow.
