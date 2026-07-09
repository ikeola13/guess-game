export const QUIZ_MAX_PLAYERS = 20;
export const QUIZ_MIN_PLAYERS = 2;
export const QUIZ_QUESTION_COUNT = 10;
export const QUIZ_OPTION_COUNT = 4;
export const QUIZ_ROUND_MS = 10_000;
export const QUIZ_REVEAL_MS = 4_000;
export const QUIZ_BREATHER_MS = 5_000;

export type QuizPhase =
  | "lobby"
  | "round-ready"
  | "breather"
  | "answering"
  | "reveal"
  | "finished";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
};

export type QuizPlayer = {
  id: string;
  name: string;
  connected: boolean;
  isReady: boolean;
  answers: Record<string, number | null>;
  score: number;
};

export type PublicQuizPlayer = {
  id: string;
  name: string;
  connected: boolean;
  isReady: boolean;
  hasAnswered: boolean;
  answeredIndex: number | null;
  score: number;
};

export type PublicQuizRoomState = {
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
  players: PublicQuizPlayer[];
};
