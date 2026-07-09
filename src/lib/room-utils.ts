import type { PublicPlayer, PublicRoomState } from "../../shared/protocol";
import type { Player } from "./game-types";
import { GUESS_CATEGORIES } from "./categories";

export function roomPlayersToGamePlayers(players: PublicPlayer[]): Player[] {
  return players.map((p) => ({
    id: p.id,
    name: p.name,
    lockedGuess: p.lockedGuess,
    hasWon: p.hasWon,
    finishOrder: p.finishOrder,
  }));
}

export function getCategoryFromRoom(room: PublicRoomState) {
  if (!room.categoryId) return null;
  return GUESS_CATEGORIES.find((c) => c.id === room.categoryId) ?? null;
}

export function getCurrentAskerIndex(room: PublicRoomState): number {
  if (!room.currentAskerId) return 0;
  return room.players.findIndex((p) => p.id === room.currentAskerId);
}
