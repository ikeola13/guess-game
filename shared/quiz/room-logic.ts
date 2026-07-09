import type {
  PublicQuizPlayer,
  PublicQuizRoomState,
  QuizPhase,
  QuizPlayer,
  QuizQuestion,
} from "./protocol";
import {
  QUIZ_MAX_PLAYERS,
  QUIZ_MIN_PLAYERS,
  QUIZ_OPTION_COUNT,
  QUIZ_BREATHER_MS,
  QUIZ_REVEAL_MS,
  QUIZ_ROUND_MS,
} from "./protocol";
import { cloneQuizTopic, validateQuizTopicData } from "./data-bank";
import type { QuizTopic } from "./data-bank";

export type QuizRoom = {
  code: string;
  hostId: string;
  maxPlayers: number;
  phase: QuizPhase;
  topicId: string;
  topicLabel: string;
  topicEmoji: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  roundEndsAt: number | null;
  revealEndsAt: number | null;
  breatherEndsAt: number | null;
  players: QuizPlayer[];
};

export type FirestoreQuizRoom = Omit<QuizRoom, "players"> & {
  players: Record<string, QuizPlayer>;
};

export function roomToFirestore(room: QuizRoom): FirestoreQuizRoom {
  const { players, ...rest } = room;
  const playersMap: Record<string, QuizPlayer> = {};
  for (const player of players) {
    playersMap[player.id] = player;
  }
  return { ...rest, players: playersMap };
}

export function firestoreToQuizRoom(data: FirestoreQuizRoom): QuizRoom {
  return {
    ...data,
    topicId: data.topicId ?? "",
    topicLabel: data.topicLabel ?? "Quiz",
    topicEmoji: data.topicEmoji ?? "📝",
    roundEndsAt: data.roundEndsAt ?? null,
    revealEndsAt: data.revealEndsAt ?? null,
    breatherEndsAt: data.breatherEndsAt ?? null,
    players: Object.values(data.players).map((player) => ({
      ...player,
      name: player.name ?? "Player",
      connected: player.connected ?? true,
      answers: player.answers ?? {},
      score: player.score ?? 0,
      isReady: player.isReady ?? false,
    })),
  };
}

function createQuizPlayer(id: string, name: string): QuizPlayer {
  return {
    id,
    name,
    connected: true,
    isReady: false,
    answers: {},
    score: 0,
  };
}

function connectedPlayers(room: QuizRoom): QuizPlayer[] {
  return room.players.filter((p) => p.connected);
}

function currentQuestion(room: QuizRoom): QuizQuestion | null {
  return room.questions[room.currentQuestionIndex] ?? null;
}

function toPublicQuizPlayer(
  player: QuizPlayer,
  questionId: string | null,
  showAnswer: boolean,
): PublicQuizPlayer {
  const answeredIndex = questionId ? (player.answers[questionId] ?? null) : null;
  return {
    id: player.id,
    name: player.name,
    connected: player.connected,
    isReady: player.isReady,
    hasAnswered: questionId ? player.answers[questionId] != null : false,
    answeredIndex: showAnswer ? answeredIndex : null,
    score: player.score,
  };
}

export function toPublicQuizState(room: QuizRoom): PublicQuizRoomState {
  const question = currentQuestion(room);
  return {
    code: room.code,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    phase: room.phase,
    topicId: room.topicId,
    topicLabel: room.topicLabel,
    topicEmoji: room.topicEmoji,
    questions: room.questions,
    currentQuestionIndex: room.currentQuestionIndex,
    roundEndsAt: room.roundEndsAt,
    revealEndsAt: room.revealEndsAt,
    breatherEndsAt: room.breatherEndsAt,
    players: room.players.map((p) =>
      toPublicQuizPlayer(p, question?.id ?? null, room.phase === "reveal" || room.phase === "finished"),
    ),
  };
}

export function generateQuizRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createQuizRoomData(
  hostId: string,
  hostName: string,
  topic: QuizTopic,
  code = generateQuizRoomCode(),
  questionCount?: number,
): { room: QuizRoom | null; error?: string } {
  const topicError = validateQuizTopicData(topic);
  if (topicError) return { room: null, error: topicError };

  const resolvedTopic = cloneQuizTopic(topic);

  const maxQuestions = resolvedTopic.questions.length;
  const count = questionCount
    ? Math.max(1, Math.min(questionCount, maxQuestions))
    : maxQuestions;
  const questions = resolvedTopic.questions.slice(0, count);

  return {
    room: {
      code,
      hostId,
      maxPlayers: QUIZ_MAX_PLAYERS,
      phase: "lobby",
      topicId: resolvedTopic.id,
      topicLabel: resolvedTopic.label,
      topicEmoji: resolvedTopic.emoji,
      questions,
      currentQuestionIndex: 0,
      roundEndsAt: null,
      revealEndsAt: null,
      breatherEndsAt: null,
      players: [createQuizPlayer(hostId, hostName)],
    },
  };
}

export function joinQuizRoomData(
  room: QuizRoom,
  playerId: string,
  playerName: string,
): { room: QuizRoom; error?: string } {
  const existing = room.players.find((p) => p.id === playerId);
  if (existing) {
    existing.connected = true;
    existing.name = playerName;
    return { room };
  }

  if (room.phase !== "lobby") {
    return { room, error: "Quiz already started" };
  }

  if (connectedPlayers(room).length >= room.maxPlayers) {
    return { room, error: "Quiz session is full" };
  }

  room.players.push(createQuizPlayer(playerId, playerName));
  return { room };
}

export function startQuizData(
  room: QuizRoom,
  hostId: string,
): { room: QuizRoom; error?: string } {
  if (room.hostId !== hostId) return { room, error: "Only the host can start" };
  if (room.phase !== "lobby") return { room, error: "Quiz already started" };
  if (connectedPlayers(room).length < QUIZ_MIN_PLAYERS) {
    return { room, error: "Need at least 2 players" };
  }

  room.phase = "round-ready";
  room.currentQuestionIndex = 0;
  room.roundEndsAt = null;
  room.revealEndsAt = null;
  room.breatherEndsAt = null;

  for (const player of room.players) {
    player.isReady = false;
    player.answers = {};
    player.score = 0;
  }

  return { room };
}

function allConnectedPlayersReady(room: QuizRoom): boolean {
  const connected = connectedPlayers(room);
  return connected.length >= QUIZ_MIN_PLAYERS && connected.every((p) => p.isReady);
}

function beginAnsweringRound(room: QuizRoom): void {
  room.phase = "answering";
  room.roundEndsAt = Date.now() + QUIZ_ROUND_MS;
  room.revealEndsAt = null;
  room.breatherEndsAt = null;
}

export function markQuizReadyData(
  room: QuizRoom,
  playerId: string,
): { room: QuizRoom; error?: string } {
  if (room.phase !== "round-ready") {
    return { room, error: "Not in round ready phase" };
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { room, error: "Player not found" };
  if (!player.connected) return { room, error: "Player is disconnected" };
  if (player.isReady) return { room };

  player.isReady = true;
  if (allConnectedPlayersReady(room)) beginAnsweringRound(room);
  return { room };
}

export function startQuizRoundData(
  room: QuizRoom,
  hostId: string,
): { room: QuizRoom; error?: string } {
  if (room.hostId !== hostId) return { room, error: "Only the host can start the round" };
  if (room.phase !== "round-ready") return { room, error: "Not in round ready phase" };
  if (connectedPlayers(room).length < QUIZ_MIN_PLAYERS) {
    return { room, error: "Need at least 2 connected players" };
  }

  beginAnsweringRound(room);
  return { room };
}

export function submitQuizAnswerData(
  room: QuizRoom,
  playerId: string,
  optionIndex: number,
): { room: QuizRoom; error?: string } {
  if (room.phase !== "answering") return { room, error: "Not in answering phase" };
  if (room.roundEndsAt && Date.now() > room.roundEndsAt) {
    return { room, error: "Time is up" };
  }

  const question = currentQuestion(room);
  if (!question) return { room, error: "No active question" };
  if (optionIndex < 0 || optionIndex >= QUIZ_OPTION_COUNT) {
    return { room, error: "Invalid answer" };
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { room, error: "Player not found" };
  if (!player.connected) return { room, error: "Player is disconnected" };
  if (player.answers[question.id] != null) return { room, error: "Already answered" };

  player.answers[question.id] = optionIndex;
  if (optionIndex === question.correctIndex) {
    player.score += 1;
  }

  return { room };
}

function beginRevealPhase(room: QuizRoom): void {
  room.phase = "reveal";
  room.roundEndsAt = null;
  room.revealEndsAt = Date.now() + QUIZ_REVEAL_MS;
}

export function finalizeQuizRoundData(room: QuizRoom): boolean {
  if (room.phase !== "answering") return false;
  beginRevealPhase(room);
  return true;
}

export function advanceAfterRevealData(room: QuizRoom): boolean {
  if (room.phase !== "reveal") return false;

  const nextIndex = room.currentQuestionIndex + 1;
  if (nextIndex >= room.questions.length) {
    room.phase = "finished";
    room.revealEndsAt = null;
    room.breatherEndsAt = null;
    return true;
  }

  room.currentQuestionIndex = nextIndex;
  room.phase = "breather";
  room.roundEndsAt = null;
  room.revealEndsAt = null;
  room.breatherEndsAt = Date.now() + QUIZ_BREATHER_MS;

  return true;
}

export function advanceAfterBreatherData(room: QuizRoom): boolean {
  if (room.phase !== "breather") return false;

  room.breatherEndsAt = null;
  beginAnsweringRound(room);
  return true;
}

export function leaveQuizRoomData(room: QuizRoom, playerId: string): QuizRoom | null {
  const player = room.players.find((p) => p.id === playerId);
  if (player) player.connected = false;

  const connected = connectedPlayers(room);
  if (connected.length === 0) return null;
  if (room.hostId === playerId) room.hostId = connected[0].id;
  return room;
}
