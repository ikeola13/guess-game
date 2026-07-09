"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import type { QuizTopic } from "../../shared/quiz/data-bank";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import {
  deleteQuizTopic,
  ensureQuizBankReady,
  firestoreToQuizTopic,
  importQuizTopics,
  saveQuizTopic,
  splitQuizTopics,
  type FirestoreQuizTopic,
} from "@/lib/firestore-quiz-bank";

export function useQuizTopics() {
  const [topics, setTopics] = useState<QuizTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      setError("Firebase is not configured. Add env variables.");
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      try {
        await ensureQuizBankReady();
        if (cancelled) return;

        unsubscribe = onSnapshot(
          collection(getFirebaseDb(), "quizTopics"),
          (snapshot) => {
            const next = snapshot.docs
              .map((docSnap) =>
                firestoreToQuizTopic(docSnap.id, docSnap.data() as FirestoreQuizTopic),
              )
              .sort((a, b) => {
                if (Boolean(a.builtin) !== Boolean(b.builtin)) {
                  return a.builtin ? -1 : 1;
                }
                return a.label.localeCompare(b.label);
              });
            setTopics(next);
            setLoading(false);
            setError(null);
          },
          (snapshotError) => {
            setError(snapshotError.message);
            setLoading(false);
          },
        );
      } catch (setupError) {
        if (cancelled) return;
        setError(
          setupError instanceof Error ? setupError.message : "Could not load quiz question bank",
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const { builtinTopics, customTopics } = useMemo(() => splitQuizTopics(topics), [topics]);

  const saveTopic = useCallback(async (topic: QuizTopic) => {
    setSaving(true);
    setError(null);
    try {
      await saveQuizTopic(topic);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Could not save category";
      setError(message);
      throw saveError;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteTopic = useCallback(async (topicId: string) => {
    setSaving(true);
    setError(null);
    try {
      await deleteQuizTopic(topicId);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Could not delete category";
      setError(message);
      throw deleteError;
    } finally {
      setSaving(false);
    }
  }, []);

  const importTopics = useCallback(async (importedTopics: QuizTopic[]) => {
    setSaving(true);
    setError(null);
    try {
      await importQuizTopics(importedTopics);
    } catch (importError) {
      const message =
        importError instanceof Error ? importError.message : "Could not import categories";
      setError(message);
      throw importError;
    } finally {
      setSaving(false);
    }
  }, []);

  const getTopicById = useCallback(
    (topicId: string) => topics.find((topic) => topic.id === topicId),
    [topics],
  );

  return {
    topics,
    builtinTopics,
    customTopics,
    loading,
    error,
    saving,
    saveTopic,
    deleteTopic,
    importTopics,
    getTopicById,
  };
}
