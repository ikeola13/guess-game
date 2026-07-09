export type GamePhase = "lobby" | "lock-in-ready" | "lock-in" | "questions" | "finished";

export type GuessAttempt = {
  id: string;
  guesserId: string;
  targetPlayerId: string;
  guess: string;
  correct: boolean;
  createdAt: number;
};

export type PublicPlayer = {
  id: string;
  name: string;
  connected: boolean;
  hasLockedIn: boolean;
  isReadyForLockIn: boolean;
  lockedGuess: string | null;
  hasWon: boolean;
  finishOrder: number | null;
};

export type PublicRoomState = {
  code: string;
  hostId: string;
  maxPlayers: number;
  phase: GamePhase;
  categoryId: string | null;
  players: PublicPlayer[];
  lockInEndsAt: number | null;
  currentAskerId: string | null;
  winnersNeeded: number;
  winnerCount: number;
  guessHistory: GuessAttempt[];
};

export const LOCK_IN_MS = 30_000;
export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 2;

export function getWinnersNeeded(playerCount: number): number {
  if (playerCount === 3) return 2;
  return 1;
}
