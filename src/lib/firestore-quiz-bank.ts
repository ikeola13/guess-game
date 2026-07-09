import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { QUIZ_TOPICS } from "../../shared/quiz/data-bank";
import type { QuizTopic } from "../../shared/quiz/data-bank";
import { cloneQuizTopic } from "../../shared/quiz/data-bank";
import { validateQuizTopicData } from "../../shared/quiz/data-bank";
import type { QuizQuestion } from "../../shared/quiz/protocol";
import { getFirebaseDb } from "@/lib/firebase";

const LEGACY_IMPORTS_KEY = "guess-game-quiz-imports";

export type FirestoreQuizTopic = {
  label: string;
  emoji: string;
  description: string;
  questions: QuizQuestion[];
  builtin: boolean;
  createdAt: number;
  updatedAt: number;
};

function topicRef(topicId: string) {
  return doc(getFirebaseDb(), "quizTopics", topicId);
}

function topicToFirestore(topic: QuizTopic): FirestoreQuizTopic {
  const now = Date.now();
  return {
    label: topic.label,
    emoji: topic.emoji,
    description: topic.description,
    questions: cloneQuizTopic(topic).questions,
    builtin: topic.builtin === true,
    createdAt: now,
    updatedAt: now,
  };
}

export function firestoreToQuizTopic(topicId: string, data: FirestoreQuizTopic): QuizTopic {
  return {
    id: topicId,
    label: data.label,
    emoji: data.emoji,
    description: data.description,
    questions: data.questions.map((question) => ({
      ...question,
      options: [...question.options] as [string, string, string, string],
    })),
    builtin: data.builtin,
    imported: !data.builtin,
  };
}

function readLegacyImportedTopics(): QuizTopic[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(LEGACY_IMPORTS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as QuizTopic[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((topic) => ({ ...topic, builtin: false, imported: true }));
  } catch {
    return [];
  }
}

function clearLegacyImportedTopics(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_IMPORTS_KEY);
}

let bankReadyPromise: Promise<void> | null = null;

export async function ensureQuizBankReady(): Promise<void> {
  if (!bankReadyPromise) {
    bankReadyPromise = (async () => {
      const batch = writeBatch(getFirebaseDb());
      let writes = 0;

      for (const topic of QUIZ_TOPICS) {
        const ref = topicRef(topic.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          batch.set(ref, {
            ...topicToFirestore({ ...topic, builtin: true }),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          writes += 1;
        }
      }

      const legacyTopics = readLegacyImportedTopics();
      for (const topic of legacyTopics) {
        const ref = topicRef(topic.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          batch.set(ref, topicToFirestore({ ...topic, builtin: false }));
          writes += 1;
        }
      }

      if (writes > 0) {
        await batch.commit();
      }

      if (legacyTopics.length > 0) {
        clearLegacyImportedTopics();
      }
    })().catch((error) => {
      bankReadyPromise = null;
      throw error;
    });
  }

  return bankReadyPromise;
}

export async function fetchQuizTopics(): Promise<QuizTopic[]> {
  await ensureQuizBankReady();
  const snap = await getDocs(collection(getFirebaseDb(), "quizTopics"));
  return snap.docs
    .map((docSnap) => firestoreToQuizTopic(docSnap.id, docSnap.data() as FirestoreQuizTopic))
    .sort((a, b) => {
      if (Boolean(a.builtin) !== Boolean(b.builtin)) {
        return a.builtin ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    });
}

export async function fetchQuizTopicById(topicId: string): Promise<QuizTopic | null> {
  await ensureQuizBankReady();
  const snap = await getDoc(topicRef(topicId));
  if (!snap.exists()) return null;
  return firestoreToQuizTopic(snap.id, snap.data() as FirestoreQuizTopic);
}

export async function saveQuizTopic(topic: QuizTopic): Promise<void> {
  if (topic.builtin) {
    throw new Error("Built-in categories cannot be edited");
  }

  const validationError = validateQuizTopicData(topic);
  if (validationError) throw new Error(validationError);

  const ref = topicRef(topic.id);
  const existing = await getDoc(ref);
  const now = Date.now();
  const payload: FirestoreQuizTopic = {
    ...topicToFirestore({ ...topic, builtin: false }),
    createdAt: existing.exists()
      ? (existing.data() as FirestoreQuizTopic).createdAt
      : now,
    updatedAt: now,
  };

  await setDoc(ref, payload);
}

export async function deleteQuizTopic(topicId: string): Promise<void> {
  const snap = await getDoc(topicRef(topicId));
  if (!snap.exists()) return;

  const data = snap.data() as FirestoreQuizTopic;
  if (data.builtin) {
    throw new Error("Built-in categories cannot be deleted");
  }

  await deleteDoc(topicRef(topicId));
}

export async function importQuizTopics(topics: QuizTopic[]): Promise<void> {
  const batch = writeBatch(getFirebaseDb());
  const now = Date.now();

  for (const topic of topics) {
    const validationError = validateQuizTopicData(topic);
    if (validationError) throw new Error(validationError);

    batch.set(topicRef(topic.id), {
      ...topicToFirestore({ ...topic, builtin: false }),
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
}

export function splitQuizTopics(topics: QuizTopic[]): {
  builtinTopics: QuizTopic[];
  customTopics: QuizTopic[];
} {
  return {
    builtinTopics: topics.filter((topic) => topic.builtin),
    customTopics: topics.filter((topic) => !topic.builtin),
  };
}
