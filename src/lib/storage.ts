const PLAYER_ID_KEY = "guess-game-player-id";
const PLAYER_NAME_KEY = "guess-game-player-name";
const ROOM_CODE_KEY = "guess-game-room-code";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getOrCreatePlayerId(): string {
  if (!isBrowser()) return "";

  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getPlayerName(): string {
  if (!isBrowser()) return "";
  return localStorage.getItem(PLAYER_NAME_KEY) ?? "";
}

export function savePlayerName(name: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(PLAYER_NAME_KEY, name.trim());
}

export function getSessionRoomCode(): string | null {
  if (!isBrowser()) return null;
  return sessionStorage.getItem(ROOM_CODE_KEY);
}

export function saveSessionRoomCode(code: string): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(ROOM_CODE_KEY, code.toUpperCase());
}

export function clearSessionRoomCode(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(ROOM_CODE_KEY);
}
