"use client";

import { useCallback, useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
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
import OnlineLockInReadyScreen from "./OnlineLockInReadyScreen";
import QuizHostSetupScreen from "./quiz/QuizHostSetupScreen";
import QuizWaitingRoom from "./quiz/QuizWaitingRoom";
import QuizBreatherScreen from "./quiz/QuizBreatherScreen";
import QuizRoundReadyScreen from "./quiz/QuizRoundReadyScreen";
import QuizAnsweringScreen from "./quiz/QuizAnsweringScreen";
import QuizRevealScreen from "./quiz/QuizRevealScreen";
import QuizFinishedScreen from "./quiz/QuizFinishedScreen";
import { createInitialState, createPlayers } from "@/lib/game-types";
import type { GuessCategory } from "@/lib/categories";
import { normalizeAnswer } from "@/lib/categories";
import type { GuessAttempt } from "../../shared/protocol";
import type { GameState } from "@/lib/game-types";
import { useFirebaseRoom } from "@/hooks/useFirebaseRoom";
import { useFirebaseQuizRoom } from "@/hooks/useFirebaseQuizRoom";
import { getCategoryFromRoom, roomPlayersToGamePlayers } from "@/lib/room-utils";
import { getWinnersNeeded } from "../../shared/protocol";
import { getPlayerName, getSessionRoomCode, getSessionQuizRoomCode } from "@/lib/storage";

type AppMode = "lobby" | "local" | "online" | "quiz-host-setup" | "quiz";

export default function GuessGame() {
  const [mode, setMode] = useState<AppMode>("lobby");
  const [game, setGame] = useState<GameState>(createInitialState);

  const socket = useFirebaseRoom();
  const quiz = useFirebaseQuizRoom();
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);

  // Auto-rejoin saved session from sessionStorage
  useEffect(() => {
    if (socket.status !== "connected") return;
    if (socket.roomState || socket.isJoining || quiz.roomState || quiz.isJoining) return;
    if (mode !== "lobby") return;

    const name = getPlayerName();
    if (!name) return;

    const savedQuiz = getSessionQuizRoomCode();
    const savedGuess = getSessionRoomCode();

    if (savedQuiz) {
      void quiz.tryRejoinQuiz(name);
    } else if (savedGuess) {
      socket.tryRejoin(name);
    }
  }, [
    socket.status,
    socket.roomState,
    socket.isJoining,
    socket.tryRejoin,
    quiz.roomState,
    quiz.isJoining,
    quiz.tryRejoinQuiz,
    mode,
  ]);

  useEffect(() => {
    if (socket.roomState && mode !== "local" && mode !== "quiz" && mode !== "quiz-host-setup") {
      setMode("online");
    }
  }, [socket.roomState, mode]);

  useEffect(() => {
    if (quiz.roomState && mode !== "local") {
      setMode("quiz");
    }
  }, [quiz.roomState, mode]);

  useEffect(() => {
    if (mode === "online" && !socket.roomState && !socket.isJoining) {
      setMode("lobby");
    }
  }, [mode, socket.roomState, socket.isJoining]);

  useEffect(() => {
    if (mode === "quiz" && !quiz.roomState && !quiz.isJoining) {
      setMode("lobby");
    }
  }, [mode, quiz.roomState, quiz.isJoining]);

  useEffect(() => {
    if (quiz.roomState?.phase === "answering") {
      setSelectedAnswerIndex(null);
    }
  }, [quiz.roomState?.currentQuestionIndex, quiz.roomState?.phase]);

  const handleStartLocal = useCallback(
    (playerCount: number, names: string[], category: GuessCategory) => {
      setGame({
        ...createInitialState(),
        phase: "lock-in",
        playerCount,
        players: createPlayers(playerCount, names),
        category,
        winnersNeeded: getWinnersNeeded(playerCount),
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

  const handleSubmitGuess = useCallback(
    (guesserId: string, targetPlayerId: string, guess: string, correct: boolean) => {
      setGame((prev) => {
        const attempt: GuessAttempt = {
          id: `${Date.now()}-${guesserId}-${prev.guessHistory.length}`,
          guesserId,
          targetPlayerId,
          guess: normalizeAnswer(guess) || "(empty)",
          correct,
          createdAt: Date.now(),
        };
        const guessHistory = [...prev.guessHistory, attempt];

        if (!correct) {
          return { ...prev, guessHistory };
        }

        const newWinnerCount = prev.winnerCount + 1;
        const players = prev.players.map((p) =>
          p.id === guesserId
            ? { ...p, hasWon: true, finishOrder: newWinnerCount }
            : p,
        );

        if (newWinnerCount >= prev.winnersNeeded) {
          return {
            ...prev,
            players,
            winnerCount: newWinnerCount,
            phase: "finished",
            guessHistory,
          };
        }

        return { ...prev, players, winnerCount: newWinnerCount, guessHistory };
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
    void quiz.leaveQuiz();
    setGame(createInitialState());
    setSelectedAnswerIndex(null);
    setMode("lobby");
  }, [socket, quiz]);

  const handleLeaveOnline = useCallback(() => {
    void socket.leaveRoom();
    setMode("lobby");
  }, [socket]);

  const handleLeaveQuiz = useCallback(() => {
    void quiz.leaveQuiz();
    setSelectedAnswerIndex(null);
    setMode("lobby");
  }, [quiz]);

  const handleSubmitQuizAnswer = useCallback(
    async (optionIndex: number) => {
      setSelectedAnswerIndex(optionIndex);
      try {
        await quiz.submitAnswer(optionIndex);
      } catch {
        setSelectedAnswerIndex(null);
      }
    },
    [quiz],
  );

  const room = socket.roomState;
  const quizRoom = quiz.roomState;
  const category = room ? getCategoryFromRoom(room) : null;
  const isHost = room ? room.hostId === socket.yourPlayerId : false;
  const isQuizHost = quizRoom ? quizRoom.hostId === quiz.yourPlayerId : false;

  const showHomeButton =
    mode !== "lobby" || socket.isJoining || quiz.isJoining;
  const isConnecting = socket.isJoining || quiz.isJoining;
  const lobbyError = socket.error ?? quiz.error;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            minHeight: 52,
            px: 1.5,
            gap: 1,
          }}
        >
          {showHomeButton && (
            <IconButton
              size="small"
              edge="start"
              onClick={handleGoHome}
              aria-label="home"
              sx={{ color: "text.secondary", ml: -0.5 }}
            >
              <HomeIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}

          <Box
            sx={{ flex: 1, minWidth: 0 }}
            onClick={handleGoHome}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleGoHome();
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "primary.main",
                cursor: "pointer",
                lineHeight: 1.2,
                letterSpacing: 0.1,
              }}
            >
              Guess Game
            </Typography>
            {mode === "online" && category && room && room.phase !== "lobby" && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {category.emoji} {category.label}
              </Typography>
            )}
            {mode === "quiz" && quizRoom && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {quizRoom.topicEmoji} {quizRoom.topicLabel}
                {quizRoom.phase !== "lobby" &&
                  ` · Q${quizRoom.currentQuestionIndex + 1}/${quizRoom.questions.length}`}
              </Typography>
            )}
            {mode === "local" && game.category && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {game.category.emoji} {game.category.label}
              </Typography>
            )}
          </Box>

          {(mode === "online" && room) || (mode === "quiz" && quizRoom) ? (
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexShrink: 0 }}>
              {(socket.status === "connected" || quiz.status === "connected") && (
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    boxShadow: "0 0 0 2px rgba(56, 106, 32, 0.15)",
                  }}
                />
              )}
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 600,
                  letterSpacing: 1.2,
                  color: "text.secondary",
                  bgcolor: "action.hover",
                  px: 1,
                  py: 0.35,
                  borderRadius: 1.5,
                  fontSize: "0.7rem",
                }}
              >
                {mode === "quiz" ? quizRoom?.code : room?.code}
              </Typography>
            </Stack>
          ) : null}
        </Toolbar>
      </AppBar>

      {isConnecting && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <CircularProgress />
            <Typography color="text.secondary">
              {mode === "quiz-host-setup" ? "Creating quiz session..." : "Connecting to room..."}
            </Typography>
          </Stack>
        </Box>
      )}

      {mode === "lobby" && !isConnecting && (
        <LobbyScreen
          connectionStatus={socket.status}
          error={lobbyError}
          onPlayLocal={() => {
            setGame(createInitialState());
            setMode("local");
          }}
          onCreateRoom={(name, maxPlayers) => {
            quiz.setError(null);
            socket.createRoom(name, maxPlayers);
          }}
          onJoinRoom={(name, code) => {
            quiz.setError(null);
            socket.joinRoom(code, name);
          }}
          onHostQuiz={() => {
            socket.setError(null);
            quiz.setError(null);
            setMode("quiz-host-setup");
          }}
          onJoinQuiz={(name, code) => {
            socket.setError(null);
            quiz.setError(null);
            void quiz.joinQuizSession(code, name);
          }}
        />
      )}

      {mode === "quiz-host-setup" && !quiz.isJoining && (
        <QuizHostSetupScreen
          onBack={() => setMode("lobby")}
          onCreate={(hostName, topicId, questionCount) => {
            void quiz.createQuizSession(hostName, topicId, questionCount);
          }}
          isCreating={quiz.isJoining}
          error={quiz.error}
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
          winnersNeeded={game.winnersNeeded}
          winnerCount={game.winnerCount}
          guessHistory={game.guessHistory}
          onSubmitGuess={handleSubmitGuess}
          onRevealAnswer={handleRevealAnswer}
        />
      )}

      {mode === "local" && game.phase === "finished" && game.category && (
        <GameOverScreen
          players={game.players}
          category={game.category}
          guessHistory={game.guessHistory}
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

      {mode === "online" && room?.phase === "lock-in-ready" && category && (
        <OnlineLockInReadyScreen
          room={room}
          category={category}
          yourPlayerId={socket.yourPlayerId}
          isHost={isHost}
          onMarkReady={socket.markReadyForLockIn}
          onStartLockIn={socket.startLockIn}
          onLeave={handleLeaveOnline}
          isMarkingReady={socket.pendingAction === "ready"}
        />
      )}

      {mode === "online" && room?.phase === "lock-in" && category && (
        <OnlineLockInScreen
          room={room}
          category={category}
          yourPlayerId={socket.yourPlayerId}
          onLockIn={socket.lockGuess}
          onLeave={handleLeaveOnline}
          isLocking={socket.pendingAction === "lock"}
        />
      )}

      {mode === "online" && room?.phase === "questions" && category && (
        <QuestionPhase
          players={roomPlayersToGamePlayers(room.players)}
          category={category}
          winnersNeeded={room.winnersNeeded}
          winnerCount={room.winnerCount}
          guessHistory={room.guessHistory}
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
          guessHistory={room.guessHistory}
          onPlayAgain={() => {
            socket.playAgain();
            socket.clearGuessResult();
          }}
          onLeave={handleLeaveOnline}
          isOnline
          isHost={isHost}
        />
      )}

      {mode === "quiz" && quizRoom?.phase === "lobby" && (
        <QuizWaitingRoom
          room={quizRoom}
          yourPlayerId={quiz.yourPlayerId}
          onStart={quiz.startQuiz}
          onLeave={handleLeaveQuiz}
        />
      )}

      {mode === "quiz" && quizRoom?.phase === "round-ready" && (
        <QuizRoundReadyScreen
          room={quizRoom}
          yourPlayerId={quiz.yourPlayerId}
          isHost={isQuizHost}
          onMarkReady={quiz.markReady}
          onStartRound={quiz.startRound}
          onLeave={handleLeaveQuiz}
          isMarkingReady={quiz.pendingAction === "ready"}
        />
      )}

      {mode === "quiz" && quizRoom?.phase === "breather" && (
        <QuizBreatherScreen room={quizRoom} onLeave={handleLeaveQuiz} />
      )}

      {mode === "quiz" && quizRoom?.phase === "answering" && (
        <QuizAnsweringScreen
          room={quizRoom}
          yourPlayerId={quiz.yourPlayerId}
          onSubmitAnswer={handleSubmitQuizAnswer}
          onLeave={handleLeaveQuiz}
          isSubmitting={quiz.pendingAction === "answer"}
          selectedIndex={selectedAnswerIndex}
        />
      )}

      {mode === "quiz" && quizRoom?.phase === "reveal" && (
        <QuizRevealScreen
          room={quizRoom}
          yourPlayerId={quiz.yourPlayerId}
          onLeave={handleLeaveQuiz}
        />
      )}

      {mode === "quiz" && quizRoom?.phase === "finished" && (
        <QuizFinishedScreen
          room={quizRoom}
          yourPlayerId={quiz.yourPlayerId}
          onLeave={handleLeaveQuiz}
        />
      )}
    </Box>
  );
}
