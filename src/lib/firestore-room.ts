import {
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  checkLockInTimer,
  createRoomData,
  firestoreToRoom,
  generateRoomCode,
  joinRoomData,
  leaveRoomData,
  lockGuessData,
  nextAskerData,
  playAgainData,
  revealAnswerData,
  roomToFirestore,
  startGameData,
  submitGuessData,
  type FirestoreRoom,
  type Room,
} from "../../shared/room-logic";

function roomRef(code: string) {
  return doc(getFirebaseDb(), "rooms", code.toUpperCase());
}

export async function loadRoom(code: string): Promise<Room | null> {
  const snap = await getDoc(roomRef(code));
  if (!snap.exists()) return null;
  return firestoreToRoom(snap.data() as FirestoreRoom);
}

export async function saveRoom(room: Room): Promise<void> {
  await setDoc(roomRef(room.code), roomToFirestore(room));
}

export async function updateRoom(
  code: string,
  updater: (room: Room) => { room: Room | null; error?: string },
): Promise<Room | null> {
  return runTransaction(getFirebaseDb(), async (tx) => {
    const ref = roomRef(code);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Room not found");

    const current = firestoreToRoom(snap.data() as FirestoreRoom);
    const { room: updated, error } = updater(current);
    if (error) throw new Error(error);
    if (updated === null) {
      tx.delete(ref);
      return null;
    }

    tx.set(ref, roomToFirestore(updated));
    return updated;
  });
}

export async function createRoom(
  playerId: string,
  playerName: string,
  maxPlayers: number,
): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateRoomCode();
    const ref = roomRef(code);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const room = createRoomData(playerId, playerName, maxPlayers, code);
      await setDoc(ref, roomToFirestore(room));
      return code;
    }
  }
  throw new Error("Could not generate room code");
}

export async function joinRoom(
  code: string,
  playerId: string,
  playerName: string,
): Promise<void> {
  await updateRoom(code, (room) => {
    const result = joinRoomData(room, playerId, playerName);
    if (result.error) return { room, error: result.error };
    return { room: result.room };
  });
}

export async function startGame(
  code: string,
  playerId: string,
  categoryId: string,
): Promise<void> {
  await updateRoom(code, (room) => {
    const result = startGameData(room, playerId, categoryId);
    if (result.error) return { room, error: result.error };
    return { room: result.room };
  });
}

export async function lockGuess(
  code: string,
  playerId: string,
  guess: string,
): Promise<void> {
  await updateRoom(code, (room) => {
    const result = lockGuessData(room, playerId, guess);
    if (result.error) return { room, error: result.error };
    return { room: result.room };
  });
}

export async function finalizeLockIn(code: string): Promise<void> {
  await runTransaction(getFirebaseDb(), async (tx) => {
    const ref = roomRef(code);
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const room = firestoreToRoom(snap.data() as FirestoreRoom);
    if (!checkLockInTimer(room)) return;
    tx.set(ref, roomToFirestore(room));
  });
}

export async function nextAsker(code: string): Promise<void> {
  await updateRoom(code, (room) => {
    const updated = nextAskerData(room);
    return { room: updated ?? room };
  });
}

export async function submitGuess(
  code: string,
  playerId: string,
  guess: string,
): Promise<boolean> {
  let correct = false;
  await updateRoom(code, (room) => {
    const result = submitGuessData(room, playerId, guess);
    if (result.error) return { room, error: result.error };
    correct = result.correct;
    return { room: result.room };
  });
  return correct;
}

export async function revealAnswer(code: string, playerId: string): Promise<void> {
  await updateRoom(code, (room) => {
    const updated = revealAnswerData(room, playerId);
    if (!updated) return { room, error: "Only the host can reveal the answer" };
    return { room: updated };
  });
}

export async function playAgain(code: string, playerId: string): Promise<void> {
  await updateRoom(code, (room) => {
    const updated = playAgainData(room, playerId);
    if (!updated) return { room, error: "Only the host can restart" };
    return { room: updated };
  });
}

export async function leaveRoom(code: string, playerId: string): Promise<void> {
  const room = await loadRoom(code);
  if (!room) return;

  const updated = leaveRoomData(room, playerId);
  if (updated === null) {
    await deleteDoc(roomRef(code));
  } else {
    await saveRoom(updated);
  }
}
