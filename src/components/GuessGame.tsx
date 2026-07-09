"use client";

import { useCallback, useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import SetupScreen from "./SetupScreen";
import LockInScreen from "./LockInScreen";
import QuestionPhase from "./QuestionPhase";
import GameOverScreen from "./GameOverScreen";
import LobbyScreen from "./LobbyScreen";
import WaitingRoom from "./WaitingRoom";
import OnlineLockInScreen from "./OnlineLockInScreen";
import { createInitialState, createPlayers } from "@/lib/game-types";
import type { GuessCategory } from "@/lib/categories";
import { normalizeAnswer } from "@/lib/categories";
import type { GameState } from "@/lib/game-types";
import { useFirebaseRoom } from "@/hooks/useFirebaseRoom";
import {
  getCategoryFromRoom,
  getCurrentAskerIndex,
  roomPlayersToGamePlayers,
} from "@/lib/room-utils";
import { getPlayerName, getSessionRoomCode } from "@/lib/storage";

type AppMode = "lobby" | "local" | "online";

export default function GuessGame() {
  const [mode, setMode] = useState<AppMode>("lobby");
  const [game, setGame] = useState<GameState>(createInitialState);

  const socket = useFirebaseRoom();

  // Auto-rejoin saved room from sessionStorage
  useEffect(() => {
    if (socket.status !== "connected" || socket.roomState || socket.isJoining) return;
    const savedRoom = getSessionRoomCode();
    const name = getPlayerName();
    if (savedRoom && name) {
      socket.tryRejoin(name);
    }
  }, [socket.status, socket.roomState, socket.isJoining, socket.tryRejoin]);

  useEffect(() => {
    if (socket.roomState && mode !== "local") {
      setMode("online");
    }
  }, [socket.roomState, mode]);

  useEffect(() => {
    if (mode === "online" && !socket.roomState && !socket.isJoining) {
      setMode("lobby");
    }
  }, [mode, socket.roomState, socket.isJoining]);

  const handleStartLocal = useCallback(
    (playerCount: number, names: string[], category: GuessCategory) => {
      setGame({
        ...createInitialState(),
        phase: "lock-in",
        playerCount,
        players: createPlayers(playerCount, names),
        category,
        winnersNeeded: playerCount === 3 ? 2 : 1,
        lockInPlayerIndex: 0,
        lockInSecondsLeft: 30,
      });
      setMode("local");
    },
    [],
  );

  const handleLockIn = useCallback((guess: string) => {
    setGame((prev) => {
      const players = prev.players.map((p, i) =>
        i === prev.lockInPlayerIndex ? { ...p, lockedGuess: normalizeAnswer(guess) } : p,
      );
      const nextIndex = prev.lockInPlayerIndex + 1;

      if (nextIndex >= prev.playerCount) {
        return { ...prev, players, phase: "questions", currentAskerIndex: 0 };
      }

      return {
        ...prev,
        players,
        lockInPlayerIndex: nextIndex,
        lockInSecondsLeft: 30,
      };
    });
  }, []);

  const handleTimeUp = useCallback(() => {
    setGame((prev) => {
      const players = prev.players.map((p, i) =>
        i === prev.lockInPlayerIndex && !p.lockedGuess
          ? { ...p, lockedGuess: "(no answer)" }
          : p,
      );
      const nextIndex = prev.lockInPlayerIndex + 1;

      if (nextIndex >= prev.playerCount) {
        return { ...prev, players, phase: "questions", currentAskerIndex: 0 };
      }

      return {
        ...prev,
        players,
        lockInPlayerIndex: nextIndex,
        lockInSecondsLeft: 30,
      };
    });
  }, []);

  const handleNextAsker = useCallback(() => {
    setGame((prev) => {
      const activeIndices = prev.players
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => !p.hasWon)
        .map(({ i }) => i);

      if (activeIndices.length === 0) return prev;

      const currentPos = activeIndices.indexOf(prev.currentAskerIndex);
      const nextPos = currentPos === -1 ? 0 : (currentPos + 1) % activeIndices.length;

      return { ...prev, currentAskerIndex: activeIndices[nextPos] };
    });
  }, []);

  const handleSubmitGuess = useCallback(
    (guesserId: string, _targetPlayerId: string, _guess: string, correct: boolean) => {
      setGame((prev) => {
        if (!correct) return prev;

        const newWinnerCount = prev.winnerCount + 1;
        const players = prev.players.map((p) =>
          p.id === guesserId
            ? { ...p, hasWon: true, finishOrder: newWinnerCount }
            : p,
        );

        if (newWinnerCount >= prev.winnersNeeded) {
          return { ...prev, players, winnerCount: newWinnerCount, phase: "finished" };
        }

        return { ...prev, players, winnerCount: newWinnerCount };
      });
    },
    [],
  );

  const handleRevealAnswer = useCallback(() => {
    setGame((prev) => ({ ...prev, phase: "finished" }));
  }, []);

  const handlePlayAgainLocal = useCallback(() => {
    setGame(createInitialState());
    setMode("lobby");
  }, []);

  const handleGoHome = useCallback(() => {
    void socket.leaveRoom();
    setGame(createInitialState());
    setMode("lobby");
  }, [socket]);

  const handleLeaveOnline = useCallback(() => {
    void socket.leaveRoom();
    setMode("lobby");
  }, [socket]);

  const room = socket.roomState;
  const category = room ? getCategoryFromRoom(room) : null;
  const isHost = room ? room.hostId === socket.yourPlayerId : false;

  const showHomeButton = mode !== "lobby" || socket.isJoining;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Toolbar>
          {showHomeButton && (
            <IconButton edge="start" onClick={handleGoHome} aria-label="home">
              <HomeIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="div"
            onClick={handleGoHome}
            sx={{
              flexGrow: 1,
              color: "primary.main",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Guess Game
          </Typography>
          {mode === "online" && room && (
            <Chip label={room.code} size="small" sx={{ mr: 1 }} />
          )}
          {mode === "online" && socket.status === "connected" && (
            <Chip label="Online" size="small" color="success" variant="outlined" />
          )}
          {mode === "local" && game.category && (
            <Typography variant="body2" color="text.secondary">
              {game.category.emoji} {game.category.label}
            </Typography>
          )}
          {mode === "online" && category && room && room.phase !== "lobby" && (
            <Typography variant="body2" color="text.secondary">
              {category.emoji} {category.label}
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      {socket.isJoining && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <CircularProgress />
            <Typography color="text.secondary">Connecting to room...</Typography>
          </Stack>
        </Box>
      )}

      {mode === "lobby" && !socket.isJoining && (
        <LobbyScreen
          connectionStatus={socket.status}
          error={socket.error}
          onPlayLocal={() => {
            setGame(createInitialState());
            setMode("local");
          }}
          onCreateRoom={(name, maxPlayers) => {
            socket.createRoom(name, maxPlayers);
          }}
          onJoinRoom={(name, code) => {
            socket.joinRoom(code, name);
          }}
        />
      )}

      {mode === "local" && game.phase === "setup" && (
        <SetupScreen onStart={handleStartLocal} />
      )}

      {mode === "local" && game.phase === "lock-in" && game.category && (
        <LockInScreen
          key={game.lockInPlayerIndex}
          player={game.players[game.lockInPlayerIndex]}
          playerIndex={game.lockInPlayerIndex}
          totalPlayers={game.playerCount}
          category={game.category}
          onLockIn={handleLockIn}
          onTimeUp={handleTimeUp}
        />
      )}

      {mode === "local" && game.phase === "questions" && game.category && (
        <QuestionPhase
          players={game.players}
          category={game.category}
          currentAskerIndex={game.currentAskerIndex}
          winnersNeeded={game.winnersNeeded}
          winnerCount={game.winnerCount}
          onNextAsker={handleNextAsker}
          onSubmitGuess={handleSubmitGuess}
          onRevealAnswer={handleRevealAnswer}
        />
      )}

      {mode === "local" && game.phase === "finished" && game.category && (
        <GameOverScreen
          players={game.players}
          category={game.category}
          onPlayAgain={handlePlayAgainLocal}
        />
      )}

      {mode === "online" && room?.phase === "lobby" && (
        <WaitingRoom
          room={room}
          yourPlayerId={socket.yourPlayerId}
          onStart={socket.startGame}
          onLeave={handleLeaveOnline}
        />
      )}

      {mode === "online" && room?.phase === "lock-in" && category && (
        <OnlineLockInScreen
          room={room}
          category={category}
          yourPlayerId={socket.yourPlayerId}
          onLockIn={socket.lockGuess}
          onLeave={handleLeaveOnline}
        />
      )}

      {mode === "online" && room?.phase === "questions" && category && (
        <QuestionPhase
          players={roomPlayersToGamePlayers(room.players)}
          category={category}
          currentAskerIndex={getCurrentAskerIndex(room)}
          currentAskerId={room.currentAskerId}
          winnersNeeded={room.winnersNeeded}
          winnerCount={room.winnerCount}
          onNextAsker={socket.nextAsker}
          onSubmitGuess={() => {}}
          onRevealAnswer={socket.revealAnswer}
          onLeave={handleLeaveOnline}
          isOnline
          myPlayerId={socket.yourPlayerId}
          serverGuessResult={socket.guessResult}
          onSubmitGuessOnline={socket.submitGuess}
          onClearGuessResult={socket.clearGuessResult}
          isHost={isHost}
        />
      )}

      {mode === "online" && room?.phase === "finished" && category && (
        <GameOverScreen
          players={roomPlayersToGamePlayers(room.players)}
          category={category}
          onPlayAgain={() => {
            socket.playAgain();
            socket.clearGuessResult();
          }}
          onLeave={handleLeaveOnline}
          isOnline
          isHost={isHost}
        />
      )}
    </Box>
  );
}
