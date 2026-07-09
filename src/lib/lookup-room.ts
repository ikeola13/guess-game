import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

export type RoomLookupResult = {
  type: "guess" | "quiz" | null;
  phase?: string;
  status: "joinable" | "in_progress" | "finished" | "not_found";
};

export async function lookupRoom(code: string): Promise<RoomLookupResult> {
  const upper = code.trim().toUpperCase();
  if (!upper) return { type: null, status: "not_found" };

  const db = getFirebaseDb();
  const [guessSnap, quizSnap] = await Promise.all([
    getDoc(doc(db, "rooms", upper)),
    getDoc(doc(db, "quizRooms", upper)),
  ]);

  if (guessSnap.exists()) {
    const data = guessSnap.data();
    const phase = data?.phase as string | undefined;
    return { type: "guess", phase, status: phaseToStatus(phase) };
  }

  if (quizSnap.exists()) {
    const data = quizSnap.data();
    const phase = data?.phase as string | undefined;
    return { type: "quiz", phase, status: phaseToStatus(phase) };
  }

  return { type: null, status: "not_found" };
}

function phaseToStatus(phase: string | undefined): RoomLookupResult["status"] {
  if (phase === "lobby") return "joinable";
  if (phase === "finished") return "finished";
  return "in_progress";
}
