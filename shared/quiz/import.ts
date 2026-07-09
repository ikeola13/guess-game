import type { QuizQuestion } from "./protocol";
import { QUIZ_OPTION_COUNT, QUIZ_QUESTION_COUNT } from "./protocol";
import type { QuizTopic } from "./data-bank";

export type QuizImportQuestionInput = {
  question?: string;
  prompt?: string;
  options: string[];
  answer?: number;
  correctIndex?: number;
  correctAnswer?: string;
};

export type QuizImportTopicInput = {
  id?: string;
  label: string;
  emoji?: string;
  description?: string;
  questions: QuizImportQuestionInput[];
};

export const QUIZ_IMPORT_EXAMPLE: QuizImportTopicInput = {
  label: "Sample Topic",
  emoji: "📚",
  description: "A custom topic you can edit and re-import",
  questions: [
    {
      question: "What is the capital of Nigeria?",
      options: ["Lagos", "Abuja", "Kano", "Ibadan"],
      correctAnswer: "Abuja",
    },
    {
      question: "How many players can join a quiz session?",
      options: ["10", "15", "20", "25"],
      answer: 2,
    },
    {
      question: "How long do players have per question?",
      options: ["5 seconds", "10 seconds", "15 seconds", "30 seconds"],
      correctIndex: 1,
    },
    {
      question: "Which tab hosts a quiz?",
      options: ["Guess", "Local", "Quiz", "Settings"],
      correctAnswer: "Quiz",
    },
    {
      question: "How many options does each question need?",
      options: ["2", "3", "4", "5"],
      answer: 2,
    },
    {
      question: "What format can you use to add topics?",
      options: ["CSV", "XML", "JSON", "YAML"],
      correctAnswer: "JSON",
    },
    {
      question: "Where are imported topics stored?",
      options: ["Firestore", "This browser", "Netlify", "GitHub"],
      correctAnswer: "This browser",
    },
    {
      question: "How many questions must each topic have?",
      options: ["5", "8", "10", "20"],
      answer: 2,
    },
    {
      question: "Can questions include images?",
      options: ["Yes", "No", "Only URLs", "Only on mobile"],
      correctAnswer: "No",
    },
    {
      question: "Who can see imported topics?",
      options: [
        "Everyone online",
        "Only this browser",
        "Only the host device",
        "Only Firebase admins",
      ],
      correctAnswer: "Only this browser",
    },
  ],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function resolveCorrectIndex(
  input: QuizImportQuestionInput,
  options: [string, string, string, string],
  questionNumber: number,
): { correctIndex?: number; error?: string } {
  const explicitIndex = input.correctIndex ?? input.answer;
  if (explicitIndex != null) {
    if (!Number.isInteger(explicitIndex) || explicitIndex < 0 || explicitIndex >= QUIZ_OPTION_COUNT) {
      return { error: `Question ${questionNumber}: answer must be 0-${QUIZ_OPTION_COUNT - 1}` };
    }
    return { correctIndex: explicitIndex };
  }

  if (input.correctAnswer != null) {
    const answerText = String(input.correctAnswer).trim();
    if (!answerText) {
      return { error: `Question ${questionNumber}: correctAnswer cannot be empty` };
    }

    const matchIndex = options.findIndex(
      (option) => option.trim().toLowerCase() === answerText.toLowerCase(),
    );
    if (matchIndex === -1) {
      return {
        error: `Question ${questionNumber}: correctAnswer "${answerText}" does not match any option`,
      };
    }
    return { correctIndex: matchIndex };
  }

  return { error: `Question ${questionNumber}: provide answer, correctIndex, or correctAnswer` };
}

function parseQuestion(
  input: QuizImportQuestionInput,
  topicId: string,
  index: number,
): { question?: QuizQuestion; error?: string } {
  const prompt = (input.prompt ?? input.question ?? "").trim();
  if (!prompt) {
    return { error: `Question ${index + 1}: missing question text` };
  }

  if (!Array.isArray(input.options) || input.options.length !== QUIZ_OPTION_COUNT) {
    return { error: `Question ${index + 1}: options must be an array of ${QUIZ_OPTION_COUNT} strings` };
  }

  const options = input.options.map((option) => String(option).trim()) as [
    string,
    string,
    string,
    string,
  ];

  if (options.some((option) => !option)) {
    return { error: `Question ${index + 1}: all options must be non-empty` };
  }

  const { correctIndex, error } = resolveCorrectIndex(input, options, index + 1);
  if (error || correctIndex == null) return { error };

  return {
    question: {
      id: `${topicId}-q${index + 1}`,
      prompt,
      options,
      correctIndex,
    },
  };
}

export function parseQuizImportTopic(
  input: QuizImportTopicInput,
  existingIds: string[] = [],
): { topic?: QuizTopic; error?: string } {
  const label = input.label?.trim();
  if (!label) return { error: "Topic label is required" };

  if (!Array.isArray(input.questions) || input.questions.length !== QUIZ_QUESTION_COUNT) {
    return { error: `Each topic must have exactly ${QUIZ_QUESTION_COUNT} questions` };
  }

  const baseId = input.id?.trim() || `imported-${slugify(label) || "topic"}`;
  let id = baseId;
  let suffix = 1;
  while (existingIds.includes(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  const questions: QuizQuestion[] = [];
  for (let i = 0; i < input.questions.length; i++) {
    const result = parseQuestion(input.questions[i], id, i);
    if (result.error || !result.question) return { error: result.error };
    questions.push(result.question);
  }

  return {
    topic: {
      id,
      label,
      emoji: input.emoji?.trim() || "📚",
      description: input.description?.trim() || "Imported topic",
      questions,
      builtin: false,
      imported: true,
    },
  };
}

export function parseQuizImportJson(
  raw: string,
  existingIds: string[] = [],
): { topics: QuizTopic[]; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { topics: [], error: "Invalid JSON" };
  }

  const inputs: QuizImportTopicInput[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && "questions" in parsed
      ? [parsed as QuizImportTopicInput]
      : [];

  if (inputs.length === 0) {
    return {
      topics: [],
      error: "JSON must be a topic object or an array of topic objects",
    };
  }

  const topics: QuizTopic[] = [];
  const usedIds = [...existingIds];

  for (let i = 0; i < inputs.length; i++) {
    const result = parseQuizImportTopic(inputs[i], usedIds);
    if (result.error || !result.topic) {
      return { topics: [], error: result.error ?? `Topic ${i + 1} is invalid` };
    }
    topics.push(result.topic);
    usedIds.push(result.topic.id);
  }

  return { topics };
}
