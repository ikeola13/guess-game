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
} from "@/lib/storage";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useFirebaseRoom() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [roomState, setRoomState] = useState<PublicRoomState | null>(null);
  const [yourPlayerId, setYourPlayerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guessResult, setGuessResult] = useState<"correct" | "wrong" | null>(null);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);

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
      playerIdRef.current = playerId;
      setYourPlayerId(playerId);

      const roomRef = doc(getFirebaseDb(), "rooms", code.toUpperCase());
      unsubscribeRef.current = onSnapshot(
        roomRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            setRoomState(null);
            return;
          }

          const data = snapshot.data() as FirestoreRoom;
          const room = firestoreToRoom(data);
          setRoomState(toPublicState(room, playerId));
          setError(null);
          setStatus("connected");

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
        setError(null);
        const playerId = getOrCreatePlayerId();
        const code = await roomApi.createRoom(playerId, playerName, maxPlayers);
        subscribeToRoom(code, playerId);
      } catch (err) {
        handleError(err);
      }
    },
    [subscribeToRoom, handleError],
  );

  const joinRoom = useCallback(
    async (roomCode: string, playerName: string) => {
      try {
        setError(null);
        const playerId = getOrCreatePlayerId();
        await roomApi.joinRoom(roomCode, playerId, playerName);
        subscribeToRoom(roomCode, playerId);
      } catch (err) {
        handleError(err);
      }
    },
    [subscribeToRoom, handleError],
  );

  const tryRejoin = useCallback(
    (playerName: string) => {
      const savedRoom = getSessionRoomCode();
      if (savedRoom) joinRoom(savedRoom, playerName);
    },
    [joinRoom],
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

  const lockGuess = useCallback(
    (guess: string) =>
      withRoom((code, playerId) => roomApi.lockGuess(code, playerId, guess)),
    [withRoom],
  );

  const nextAsker = useCallback(
    () => withRoom((code) => roomApi.nextAsker(code)),
    [withRoom],
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
    clearSessionRoomCode();
    setRoomState(null);
    setActiveRoomCode(null);
  }, [activeRoomCode, roomState?.code]);

  const disconnect = leaveRoom;
  const clearGuessResult = useCallback(() => setGuessResult(null), []);

  return {
    status,
    roomState,
    yourPlayerId,
    error,
    guessResult,
    createRoom,
    joinRoom,
    tryRejoin,
    startGame,
    lockGuess,
    nextAsker,
    submitGuess,
    revealAnswer,
    playAgain,
    leaveRoom,
    disconnect,
    clearGuessResult,
    setError,
  };
}
