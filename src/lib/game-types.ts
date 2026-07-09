import type { GuessCategory } from "./categories";

export type GamePhase = "setup" | "lock-in" | "questions" | "finished";

export type Player = {
  id: string;
  name: string;
  lockedGuess: string | null;
  hasWon: boolean;
  finishOrder: number | null;
};

export type GameState = {
  phase: GamePhase;
  playerCount: number;
  players: Player[];
  category: GuessCategory | null;
  lockInPlayerIndex: number;
  lockInSecondsLeft: number;
  currentAskerIndex: number;
  winnersNeeded: number;
  winnerCount: number;
};

export function createInitialState(): GameState {
  return {
    phase: "setup",
    playerCount: 2,
    players: [],
    category: null,
    lockInPlayerIndex: 0,
    lockInSecondsLeft: 30,
    currentAskerIndex: 0,
    winnersNeeded: 1,
    winnerCount: 0,
  };
}

export function createPlayers(count: number, names: string[]): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i}`,
    name: names[i]?.trim() || `Player ${i + 1}`,
    lockedGuess: null,
    hasWon: false,
    finishOrder: null,
  }));
}
