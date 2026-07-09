"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import type { PublicRoomState } from "../../shared/protocol";
import { toPublicState, firestoreToRoom } from "../../shared/room-logic";
import type { FirestoreRoom } from "../../shared/room-logic";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import * as roomApi from "@/lib/firestore-room";
import {
  clearSessionRoomCode,
  getOrCreatePlayerId,
  getSessionRoomCode,
  saveSessionRoomCode,
  clearSessionQuizRoomCode,
} from "@/lib/storage";

type ConnectionStatus = "connecting" | "connected" | "disconnected";
type PendingAction = "ready" | "lock" | null;

export function useFirebaseRoom() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [roomState, setRoomState] = useState<PublicRoomState | null>(null);
  const [yourPlayerId, setYourPlayerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guessResult, setGuessResult] = useState<"correct" | "wrong" | null>(null);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const playerIdRef = useRef("");
  const finalizeCalledRef = useRef(false);

  const handleError = useCallback((err: unknown) => {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Something went wrong";
    setError(message);
  }, []);

  const subscribeToRoom = useCallback(
    (code: string, playerId: string) => {
      unsubscribeRef.current?.();
      finalizeCalledRef.current = false;
      setActiveRoomCode(code);
      saveSessionRoomCode(code);
      clearSessionQuizRoomCode();
      playerIdRef.current = playerId;
      setYourPlayerId(playerId);

      const roomRef = doc(getFirebaseDb(), "rooms", code.toUpperCase());
      unsubscribeRef.current = onSnapshot(
        roomRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            unsubscribeRef.current?.();
            unsubscribeRef.current = null;
            setRoomState(null);
            setActiveRoomCode(null);
            setIsJoining(false);
            clearSessionRoomCode();
            setError("Room not found");
            return;
          }

          const data = snapshot.data() as FirestoreRoom;
          const room = firestoreToRoom(data);
          setRoomState(toPublicState(room, playerId));
          setError(null);
          setStatus("connected");
          setIsJoining(false);

          if (
            data.phase === "lock-in" &&
            data.lockInEndsAt &&
            Date.now() >= data.lockInEndsAt &&
            !finalizeCalledRef.current
          ) {
            finalizeCalledRef.current = true;
            roomApi.finalizeLockIn(code).catch(() => {
              finalizeCalledRef.current = false;
            });
          }

          if (data.phase !== "lock-in") {
            finalizeCalledRef.current = false;
          }
        },
        (err) => handleError(err),
      );
    },
    [handleError],
  );

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

  const createRoom = useCallback(
    async (playerName: string, maxPlayers: number) => {
      try {
        setIsJoining(true);
        setError(null);
        const playerId = getOrCreatePlayerId();
        const code = await roomApi.createRoom(playerId, playerName, maxPlayers);
        subscribeToRoom(code, playerId);
      } catch (err) {
        setIsJoining(false);
        handleError(err);
      }
    },
    [subscribeToRoom, handleError],
  );

  const joinRoom = useCallback(
    async (roomCode: string, playerName: string) => {
      try {
        setIsJoining(true);
        setError(null);
        const playerId = getOrCreatePlayerId();
        await roomApi.joinRoom(roomCode, playerId, playerName);
        subscribeToRoom(roomCode, playerId);
      } catch (err) {
        setIsJoining(false);
        clearSessionRoomCode();
        handleError(err);
      }
    },
    [subscribeToRoom, handleError],
  );

  const tryRejoin = useCallback(
    async (playerName: string) => {
      const savedRoom = getSessionRoomCode();
      if (!savedRoom) return;
      try {
        setIsJoining(true);
        setError(null);
        const playerId = getOrCreatePlayerId();
        await roomApi.joinRoom(savedRoom, playerId, playerName);
        subscribeToRoom(savedRoom, playerId);
      } catch (err) {
        setIsJoining(false);
        handleError(err);
      }
    },
    [subscribeToRoom, handleError],
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

  const startGame = useCallback(
    (categoryId: string) =>
      withRoom((code, playerId) => roomApi.startGame(code, playerId, categoryId)),
    [withRoom],
  );

  const markReadyForLockIn = useCallback(
    async () => {
      const code = activeRoomCode ?? roomState?.code;
      const playerId = playerIdRef.current;
      if (!code || !playerId) return;

      setPendingAction("ready");
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((player) =>
            player.id === playerId
              ? { ...player, isReadyForLockIn: true }
              : player,
          ),
        };
      });

      try {
        setError(null);
        await roomApi.markReadyForLockIn(code, playerId);
      } catch (err) {
        handleError(err);
      } finally {
        setPendingAction(null);
      }
    },
    [activeRoomCode, roomState?.code, handleError],
  );

  const startLockIn = useCallback(
    () => withRoom((code, playerId) => roomApi.startLockIn(code, playerId)),
    [withRoom],
  );

  const lockGuess = useCallback(
    async (guess: string) => {
      const code = activeRoomCode ?? roomState?.code;
      const playerId = playerIdRef.current;
      if (!code || !playerId) return;

      setPendingAction("lock");
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((player) =>
            player.id === playerId
              ? { ...player, hasLockedIn: true, lockedGuess: "🔒" }
              : player,
          ),
        };
      });

      try {
        setError(null);
        await roomApi.lockGuess(code, playerId, guess);
      } catch (err) {
        handleError(err);
      } finally {
        setPendingAction(null);
      }
    },
    [activeRoomCode, roomState?.code, handleError],
  );

  const submitGuess = useCallback(
    async (targetPlayerId: string, guess: string) => {
      setGuessResult(null);
      const code = activeRoomCode ?? roomState?.code;
      const playerId = playerIdRef.current;
      if (!code || !playerId) return;
      try {
        const correct = await roomApi.submitGuess(code, playerId, targetPlayerId, guess);
        setGuessResult(correct ? "correct" : "wrong");
      } catch (err) {
        handleError(err);
      }
    },
    [activeRoomCode, roomState?.code, handleError],
  );

  const revealAnswer = useCallback(
    () => withRoom((code, playerId) => roomApi.revealAnswer(code, playerId)),
    [withRoom],
  );

  const playAgain = useCallback(
    () => withRoom((code, playerId) => roomApi.playAgain(code, playerId)),
    [withRoom],
  );

  const leaveRoom = useCallback(async () => {
    const code = activeRoomCode ?? roomState?.code;
    const playerId = playerIdRef.current;
    if (code && playerId) {
      try {
        await roomApi.leaveRoom(code, playerId);
      } catch {
        // ignore
      }
    }
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    clearSessionRoomCode();
    setRoomState(null);
    setActiveRoomCode(null);
    setError(null);
    setGuessResult(null);
    setIsJoining(false);
    setPendingAction(null);
  }, [activeRoomCode, roomState?.code]);

  const disconnect = leaveRoom;
  const clearGuessResult = useCallback(() => setGuessResult(null), []);

  return {
    status,
    roomState,
    yourPlayerId,
    error,
    guessResult,
    isJoining,
    pendingAction,
    createRoom,
    joinRoom,
    tryRejoin,
    startGame,
    markReadyForLockIn,
    startLockIn,
    lockGuess,
    submitGuess,
    revealAnswer,
    playAgain,
    leaveRoom,
    disconnect,
    clearGuessResult,
    setError,
  };
}
