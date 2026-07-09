"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import type { PublicQuizRoomState } from "../../shared/quiz/protocol";
import { toPublicQuizState, firestoreToQuizRoom } from "../../shared/quiz/room-logic";
import type { FirestoreQuizRoom } from "../../shared/quiz/room-logic";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import * as quizApi from "@/lib/firestore-quiz";
import { fetchQuizTopicById } from "@/lib/firestore-quiz-bank";
import {
  clearSessionQuizRoomCode,
  getOrCreatePlayerId,
  getSessionQuizRoomCode,
  saveSessionQuizRoomCode,
  clearSessionRoomCode,
} from "@/lib/storage";

type ConnectionStatus = "connecting" | "connected" | "disconnected";
type PendingAction = "ready" | "answer" | null;

export function useFirebaseQuizRoom() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [roomState, setRoomState] = useState<PublicQuizRoomState | null>(null);
  const [yourPlayerId, setYourPlayerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const playerIdRef = useRef("");
  const finalizeRoundRef = useRef(false);
  const advanceRevealRef = useRef(false);
  const advanceBreatherRef = useRef(false);

  const handleError = useCallback((err: unknown) => {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Something went wrong";
    setError(message);
  }, []);

  const subscribeToQuizRoom = useCallback(
    (code: string, playerId: string) => {
      unsubscribeRef.current?.();
      finalizeRoundRef.current = false;
      advanceRevealRef.current = false;
      advanceBreatherRef.current = false;
      setActiveRoomCode(code);
      saveSessionQuizRoomCode(code);
      clearSessionRoomCode();
      playerIdRef.current = playerId;
      setYourPlayerId(playerId);

      const roomRef = doc(getFirebaseDb(), "quizRooms", code.toUpperCase());
      unsubscribeRef.current = onSnapshot(
        roomRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            unsubscribeRef.current?.();
            unsubscribeRef.current = null;
            setRoomState(null);
            setActiveRoomCode(null);
            setIsJoining(false);
            clearSessionQuizRoomCode();
            setError("Quiz session not found");
            return;
          }

          const data = snapshot.data() as FirestoreQuizRoom;
          const room = firestoreToQuizRoom(data);
          setRoomState(toPublicQuizState(room));
          setError(null);
          setStatus("connected");
          setIsJoining(false);

          if (
            data.phase === "answering" &&
            data.roundEndsAt &&
            Date.now() >= data.roundEndsAt &&
            !finalizeRoundRef.current
          ) {
            finalizeRoundRef.current = true;
            quizApi.finalizeQuizRound(code).catch(() => {
              finalizeRoundRef.current = false;
            });
          }

          if (
            data.phase === "reveal" &&
            data.revealEndsAt &&
            Date.now() >= data.revealEndsAt &&
            !advanceRevealRef.current
          ) {
            advanceRevealRef.current = true;
            quizApi.advanceQuizAfterReveal(code).catch(() => {
              advanceRevealRef.current = false;
            });
          }

          if (
            data.phase === "breather" &&
            data.breatherEndsAt &&
            Date.now() >= data.breatherEndsAt &&
            !advanceBreatherRef.current
          ) {
            advanceBreatherRef.current = true;
            quizApi.advanceQuizAfterBreather(code).catch(() => {
              advanceBreatherRef.current = false;
            });
          }

          if (data.phase !== "answering") finalizeRoundRef.current = false;
          if (data.phase !== "reveal") advanceRevealRef.current = false;
          if (data.phase !== "breather") advanceBreatherRef.current = false;
        },
        (err) => handleError(err),
      );
    },
    [handleError],
  );

  // Firestore snapshots only fire on document changes, not when a timer expires.
  // Schedule phase transitions locally so every client advances together.
  useEffect(() => {
    const code = activeRoomCode ?? roomState?.code;
    if (!code || !roomState) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const schedule = (delayMs: number, action: () => void) => {
      if (delayMs <= 0) {
        action();
        return;
      }
      timeouts.push(setTimeout(action, delayMs + 50));
    };

    if (roomState.phase === "answering" && roomState.roundEndsAt) {
      schedule(roomState.roundEndsAt - Date.now(), () => {
        if (finalizeRoundRef.current) return;
        finalizeRoundRef.current = true;
        quizApi.finalizeQuizRound(code).catch(() => {
          finalizeRoundRef.current = false;
        });
      });
    }

    if (roomState.phase === "reveal" && roomState.revealEndsAt) {
      schedule(roomState.revealEndsAt - Date.now(), () => {
        if (advanceRevealRef.current) return;
        advanceRevealRef.current = true;
        quizApi.advanceQuizAfterReveal(code).catch(() => {
          advanceRevealRef.current = false;
        });
      });
    }

    if (roomState.phase === "breather" && roomState.breatherEndsAt) {
      schedule(roomState.breatherEndsAt - Date.now(), () => {
        if (advanceBreatherRef.current) return;
        advanceBreatherRef.current = true;
        quizApi.advanceQuizAfterBreather(code).catch(() => {
          advanceBreatherRef.current = false;
        });
      });
    }

    return () => {
      for (const timeout of timeouts) clearTimeout(timeout);
    };
  }, [
    activeRoomCode,
    roomState?.code,
    roomState?.phase,
    roomState?.roundEndsAt,
    roomState?.revealEndsAt,
    roomState?.breatherEndsAt,
    roomState?.currentQuestionIndex,
  ]);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setStatus("disconnected");
      setError("Firebase is not configured. Add env variables.");
      return;
    }
    setStatus("connected");
    playerIdRef.current = getOrCreatePlayerId();
    setYourPlayerId(playerIdRef.current);
    return () => unsubscribeRef.current?.();
  }, []);

  const createQuizSession = useCallback(
    async (hostName: string, topicId: string, questionCount?: number) => {
      try {
        setIsJoining(true);
        setError(null);
        const topic = await fetchQuizTopicById(topicId);
        if (!topic) throw new Error("Quiz topic not found");
        const playerId = getOrCreatePlayerId();
        const code = await quizApi.createQuizRoom(playerId, hostName, topic, questionCount);
        subscribeToQuizRoom(code, playerId);
      } catch (err) {
        setIsJoining(false);
        handleError(err);
      }
    },
    [subscribeToQuizRoom, handleError],
  );

  const joinQuizSession = useCallback(
    async (roomCode: string, playerName: string) => {
      try {
        setIsJoining(true);
        setError(null);
        const playerId = getOrCreatePlayerId();
        await quizApi.joinQuizRoom(roomCode, playerId, playerName);
        subscribeToQuizRoom(roomCode, playerId);
      } catch (err) {
        setIsJoining(false);
        clearSessionQuizRoomCode();
        handleError(err);
      }
    },
    [subscribeToQuizRoom, handleError],
  );

  const tryRejoinQuiz = useCallback(
    async (playerName: string) => {
      const savedRoom = getSessionQuizRoomCode();
      if (!savedRoom) return;
      try {
        setIsJoining(true);
        setError(null);
        const playerId = getOrCreatePlayerId();
        await quizApi.joinQuizRoom(savedRoom, playerId, playerName);
        subscribeToQuizRoom(savedRoom, playerId);
      } catch (err) {
        setIsJoining(false);
        handleError(err);
      }
    },
    [subscribeToQuizRoom, handleError],
  );

  const withRoom = useCallback(
    async (action: (code: string, playerId: string) => Promise<void>) => {
      const code = activeRoomCode ?? roomState?.code;
      const playerId = playerIdRef.current;
      if (!code || !playerId) return;
      try {
        setError(null);
        await action(code, playerId);
      } catch (err) {
        handleError(err);
      }
    },
    [activeRoomCode, roomState?.code, handleError],
  );

  const startQuiz = useCallback(
    () => withRoom((code, playerId) => quizApi.startQuiz(code, playerId)),
    [withRoom],
  );

  const markReady = useCallback(async () => {
    const code = activeRoomCode ?? roomState?.code;
    const playerId = playerIdRef.current;
    if (!code || !playerId) return;

    setPendingAction("ready");
    setRoomState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map((player) =>
          player.id === playerId ? { ...player, isReady: true } : player,
        ),
      };
    });

    try {
      setError(null);
      await quizApi.markQuizReady(code, playerId);
    } catch (err) {
      handleError(err);
    } finally {
      setPendingAction(null);
    }
  }, [activeRoomCode, roomState?.code, handleError]);

  const startRound = useCallback(
    () => withRoom((code, playerId) => quizApi.startQuizRound(code, playerId)),
    [withRoom],
  );

  const submitAnswer = useCallback(
    async (optionIndex: number) => {
      const code = activeRoomCode ?? roomState?.code;
      const playerId = playerIdRef.current;
      if (!code || !playerId) return;

      setPendingAction("answer");
      try {
        setError(null);
        await quizApi.submitQuizAnswer(code, playerId, optionIndex);
      } catch (err) {
        handleError(err);
      } finally {
        setPendingAction(null);
      }
    },
    [activeRoomCode, roomState?.code, handleError],
  );

  const leaveQuiz = useCallback(async () => {
    const code = activeRoomCode ?? roomState?.code;
    const playerId = playerIdRef.current;
    if (code && playerId) {
      try {
        await quizApi.leaveQuizRoom(code, playerId);
      } catch {
        // ignore
      }
    }
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    clearSessionQuizRoomCode();
    setRoomState(null);
    setActiveRoomCode(null);
    setError(null);
    setIsJoining(false);
    setPendingAction(null);
  }, [activeRoomCode, roomState?.code]);

  return {
    status,
    roomState,
    yourPlayerId,
    error,
    isJoining,
    pendingAction,
    createQuizSession,
    joinQuizSession,
    tryRejoinQuiz,
    startQuiz,
    markReady,
    startRound,
    submitAnswer,
    leaveQuiz,
    setError,
  };
}
