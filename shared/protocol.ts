export type GamePhase = "lobby" | "lock-in" | "questions" | "finished";

export type PublicPlayer = {
  id: string;
  name: string;
  connected: boolean;
  hasLockedIn: boolean;
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
  secretAnswer: string | null;
};

export const LOCK_IN_MS = 30_000;
export const MAX_PLAYERS = 3;
export const MIN_PLAYERS = 2;
