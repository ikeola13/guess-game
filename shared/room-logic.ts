import type { GamePhase, PublicPlayer, PublicRoomState } from "./protocol";
import { LOCK_IN_MS, MAX_PLAYERS } from "./protocol";
import { GUESS_CATEGORIES, isCorrectGuess, normalizeAnswer } from "./categories";

export type RoomPlayer = {
  id: string;
  name: string;
  connected: boolean;
  lockedGuess: string | null;
  hasLockedIn: boolean;
  hasWon: boolean;
  finishOrder: number | null;
};

export type Room = {
  code: string;
  hostId: string;
  maxPlayers: number;
  phase: GamePhase;
  categoryId: string | null;
  players: RoomPlayer[];
  lockInEndsAt: number | null;
  currentAskerId: string | null;
  winnersNeeded: number;
  winnerCount: number;
};

export type FirestoreRoom = Omit<Room, "players"> & {
  players: Record<string, RoomPlayer>;
};

export function roomToFirestore(room: Room): FirestoreRoom {
  const { players, ...rest } = room;
  const playersMap: Record<string, RoomPlayer> = {};
  for (const p of players) {
    playersMap[p.id] = p;
  }
  return { ...rest, players: playersMap };
}

export function firestoreToRoom(data: FirestoreRoom): Room {
  return {
    ...data,
    players: Object.values(data.players),
  };
}

function createPlayer(id: string, name: string): RoomPlayer {
  return {
    id,
    name,
    connected: true,
    lockedGuess: null,
    hasLockedIn: false,
    hasWon: false,
    finishOrder: null,
  };
}

function toPublicPlayer(player: RoomPlayer, viewerId: string, phase: GamePhase): PublicPlayer {
  const showGuess = phase === "finished" || player.id === viewerId;
  return {
    id: player.id,
    name: player.name,
    connected: player.connected,
    hasLockedIn: player.hasLockedIn,
    lockedGuess: showGuess ? player.lockedGuess : player.hasLockedIn ? "🔒" : null,
    hasWon: player.hasWon,
    finishOrder: player.finishOrder,
  };
}

export function toPublicState(room: Room, viewerId: string): PublicRoomState {
  return {
    code: room.code,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    phase: room.phase,
    categoryId: room.categoryId,
    players: room.players.map((p) => toPublicPlayer(p, viewerId, room.phase)),
    lockInEndsAt: room.lockInEndsAt,
    currentAskerId: room.currentAskerId,
    winnersNeeded: room.winnersNeeded,
    winnerCount: room.winnerCount,
  };
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function allPlayersLockedIn(room: Room): boolean {
  return room.players.every((p) => p.hasLockedIn);
}

function finalizeLockIn(room: Room): void {
  for (const player of room.players) {
    if (!player.hasLockedIn) {
      player.lockedGuess = "(no answer)";
      player.hasLockedIn = true;
    }
  }
  room.phase = "questions";
  room.lockInEndsAt = null;
  room.currentAskerId = room.players[0]?.id ?? null;
}

export function createRoomData(
  playerId: string,
  playerName: string,
  maxPlayers: number,
  code = generateRoomCode(),
): Room {
  const capped = Math.min(Math.max(maxPlayers, 2), MAX_PLAYERS);
  return {
    code,
    hostId: playerId,
    maxPlayers: capped,
    phase: "lobby",
    categoryId: null,
    players: [createPlayer(playerId, playerName)],
    lockInEndsAt: null,
    currentAskerId: null,
    winnersNeeded: capped === 3 ? 2 : 1,
    winnerCount: 0,
  };
}

export function joinRoomData(
  room: Room,
  playerId: string,
  playerName: string,
): { room: Room; error?: string } {
  if (room.phase !== "lobby") return { room, error: "Game already started" };

  const existing = room.players.find((p) => p.id === playerId);
  if (existing) {
    existing.connected = true;
    existing.name = playerName;
    return { room };
  }

  if (room.players.filter((p) => p.connected).length >= room.maxPlayers) {
    return { room, error: "Room is full" };
  }

  room.players.push(createPlayer(playerId, playerName));
  return { room };
}

export function startGameData(
  room: Room,
  hostId: string,
  categoryId: string,
): { room: Room; error?: string } {
  if (room.hostId !== hostId) return { room, error: "Only the host can start" };
  if (room.phase !== "lobby") return { room, error: "Game already started" };

  const connected = room.players.filter((p) => p.connected);
  if (connected.length < 2) return { room, error: "Need at least 2 players" };

  const category = GUESS_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return { room, error: "Invalid category" };

  room.categoryId = categoryId;
  room.phase = "lock-in";
  room.lockInEndsAt = Date.now() + LOCK_IN_MS;
  room.winnersNeeded = connected.length === 3 ? 2 : 1;
  room.winnerCount = 0;
  room.currentAskerId = null;

  for (const player of room.players) {
    player.lockedGuess = null;
    player.hasLockedIn = false;
    player.hasWon = false;
    player.finishOrder = null;
  }

  return { room };
}

export function lockGuessData(
  room: Room,
  playerId: string,
  guess: string,
): { room: Room; error?: string } {
  if (room.phase !== "lock-in") return { room, error: "Not in lock-in phase" };

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { room, error: "Player not found" };
  if (player.hasLockedIn) return { room, error: "Already locked in" };

  player.lockedGuess = normalizeAnswer(guess) || "(no answer)";
  player.hasLockedIn = true;

  if (allPlayersLockedIn(room)) finalizeLockIn(room);
  return { room };
}

export function checkLockInTimer(room: Room): boolean {
  if (room.phase !== "lock-in" || !room.lockInEndsAt) return false;
  if (allPlayersLockedIn(room) || Date.now() >= room.lockInEndsAt) {
    finalizeLockIn(room);
    return true;
  }
  return false;
}

export function nextAskerData(room: Room): Room | null {
  if (room.phase !== "questions") return null;

  const active = room.players.filter((p) => !p.hasWon);
  if (active.length === 0) return room;

  const currentIdx = active.findIndex((p) => p.id === room.currentAskerId);
  const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % active.length;
  room.currentAskerId = active[nextIdx].id;
  return room;
}

export function submitGuessData(
  room: Room,
  guesserId: string,
  targetPlayerId: string,
  guess: string,
): { room: Room; correct: boolean; error?: string } {
  if (room.phase !== "questions") return { room, correct: false, error: "Not in question phase" };

  const guesser = room.players.find((p) => p.id === guesserId);
  if (!guesser) return { room, correct: false, error: "Player not found" };
  if (guesser.hasWon) return { room, correct: false, error: "Already won" };
  if (guesserId === targetPlayerId) {
    return { room, correct: false, error: "You cannot guess your own answer" };
  }

  const target = room.players.find((p) => p.id === targetPlayerId);
  if (!target) return { room, correct: false, error: "Target player not found" };
  if (!target.lockedGuess) return { room, correct: false, error: "Target has no answer" };

  const correct = isCorrectGuess(guess, target.lockedGuess);
  if (correct) {
    room.winnerCount += 1;
    guesser.hasWon = true;
    guesser.finishOrder = room.winnerCount;
    if (room.winnerCount >= room.winnersNeeded) room.phase = "finished";
  }

  return { room, correct };
}

export function revealAnswerData(room: Room, hostId: string): Room | null {
  if (room.hostId !== hostId) return null;
  room.phase = "finished";
  return room;
}

export function playAgainData(room: Room, hostId: string): Room | null {
  if (room.hostId !== hostId) return null;

  room.phase = "lobby";
  room.categoryId = null;
  room.lockInEndsAt = null;
  room.currentAskerId = null;
  room.winnerCount = 0;

  for (const player of room.players) {
    player.lockedGuess = null;
    player.hasLockedIn = false;
    player.hasWon = false;
    player.finishOrder = null;
  }

  return room;
}

export function leaveRoomData(room: Room, playerId: string): Room | null {
  const player = room.players.find((p) => p.id === playerId);
  if (player) player.connected = false;

  const connected = room.players.filter((p) => p.connected);
  if (connected.length === 0) return null;

  if (room.hostId === playerId) room.hostId = connected[0].id;
  return room;
}
