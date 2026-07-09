import {
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  advanceAfterRevealData,
  advanceAfterBreatherData,
  createQuizRoomData,
  finalizeQuizRoundData,
  firestoreToQuizRoom,
  generateQuizRoomCode,
  joinQuizRoomData,
  leaveQuizRoomData,
  markQuizReadyData,
  roomToFirestore,
  startQuizData,
  startQuizRoundData,
  submitQuizAnswerData,
  type FirestoreQuizRoom,
  type QuizRoom,
} from "../../shared/quiz/room-logic";
import type { QuizTopic } from "../../shared/quiz/data-bank";

function quizRoomRef(code: string) {
  return doc(getFirebaseDb(), "quizRooms", code.toUpperCase());
}

export async function updateQuizRoom(
  code: string,
  updater: (room: QuizRoom) => { room: QuizRoom | null; error?: string },
): Promise<QuizRoom | null> {
  return runTransaction(getFirebaseDb(), async (tx) => {
    const ref = quizRoomRef(code);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Quiz session not found");

    const current = firestoreToQuizRoom(snap.data() as FirestoreQuizRoom);
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

export async function createQuizRoom(
  hostId: string,
  hostName: string,
  topic: QuizTopic,
  questionCount?: number,
): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateQuizRoomCode();
    const ref = quizRoomRef(code);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const { room, error } = createQuizRoomData(hostId, hostName, topic, code, questionCount);
      if (error || !room) throw new Error(error ?? "Could not create quiz session");
      await setDoc(ref, roomToFirestore(room));
      return code;
    }
  }
  throw new Error("Could not generate quiz session code");
}

export async function joinQuizRoom(
  code: string,
  playerId: string,
  playerName: string,
): Promise<void> {
  await updateQuizRoom(code, (room) => {
    const result = joinQuizRoomData(room, playerId, playerName);
    if (result.error) return { room, error: result.error };
    return { room: result.room };
  });
}

export async function startQuiz(code: string, hostId: string): Promise<void> {
  await updateQuizRoom(code, (room) => {
    const result = startQuizData(room, hostId);
    if (result.error) return { room, error: result.error };
    return { room: result.room };
  });
}

export async function markQuizReady(code: string, playerId: string): Promise<void> {
  await updateQuizRoom(code, (room) => {
    const result = markQuizReadyData(room, playerId);
    if (result.error) return { room, error: result.error };
    return { room: result.room };
  });
}

export async function startQuizRound(code: string, hostId: string): Promise<void> {
  await updateQuizRoom(code, (room) => {
    const result = startQuizRoundData(room, hostId);
    if (result.error) return { room, error: result.error };
    return { room: result.room };
  });
}

export async function submitQuizAnswer(
  code: string,
  playerId: string,
  optionIndex: number,
): Promise<void> {
  await updateQuizRoom(code, (room) => {
    const result = submitQuizAnswerData(room, playerId, optionIndex);
    if (result.error) return { room, error: result.error };
    return { room: result.room };
  });
}

export async function finalizeQuizRound(code: string): Promise<void> {
  await runTransaction(getFirebaseDb(), async (tx) => {
    const ref = quizRoomRef(code);
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const room = firestoreToQuizRoom(snap.data() as FirestoreQuizRoom);
    if (!finalizeQuizRoundData(room)) return;
    tx.set(ref, roomToFirestore(room));
  });
}

export async function advanceQuizAfterReveal(code: string): Promise<void> {
  await runTransaction(getFirebaseDb(), async (tx) => {
    const ref = quizRoomRef(code);
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const room = firestoreToQuizRoom(snap.data() as FirestoreQuizRoom);
    if (!advanceAfterRevealData(room)) return;
    tx.set(ref, roomToFirestore(room));
  });
}

export async function advanceQuizAfterBreather(code: string): Promise<void> {
  await runTransaction(getFirebaseDb(), async (tx) => {
    const ref = quizRoomRef(code);
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const room = firestoreToQuizRoom(snap.data() as FirestoreQuizRoom);
    if (!advanceAfterBreatherData(room)) return;
    tx.set(ref, roomToFirestore(room));
  });
}

export async function leaveQuizRoom(code: string, playerId: string): Promise<void> {
  const ref = quizRoomRef(code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const room = firestoreToQuizRoom(snap.data() as FirestoreQuizRoom);
  const updated = leaveQuizRoomData(room, playerId);
  if (updated === null) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, roomToFirestore(updated));
  }
}
