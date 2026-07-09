import type { QuizQuestion } from "./protocol";
import { QUIZ_OPTION_COUNT, QUIZ_QUESTION_COUNT } from "./protocol";

export type QuizTopic = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  questions: QuizQuestion[];
  builtin?: boolean;
  /** @deprecated Use builtin === false */
  imported?: boolean;
};

function q(
  topicId: string,
  index: number,
  prompt: string,
  options: [string, string, string, string],
  correctIndex: number,
): QuizQuestion {
  return {
    id: `${topicId}-q${index + 1}`,
    prompt,
    options,
    correctIndex,
  };
}

export const QUIZ_TOPICS: QuizTopic[] = [
  {
    id: "general",
    label: "General Knowledge",
    emoji: "🧠",
    description: "A mix of everyday trivia",
    questions: [
      q("general", 0, "What is the capital of France?", ["London", "Paris", "Berlin", "Madrid"], 1),
      q("general", 1, "How many continents are there?", ["5", "6", "7", "8"], 2),
      q("general", 2, "Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Saturn"], 1),
      q("general", 3, "What is the largest ocean on Earth?", ["Atlantic", "Indian", "Arctic", "Pacific"], 3),
      q("general", 4, "Who painted the Mona Lisa?", ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo"], 2),
      q("general", 5, "What is the chemical symbol for gold?", ["Go", "Gd", "Au", "Ag"], 2),
      q("general", 6, "How many days are in a leap year?", ["364", "365", "366", "367"], 2),
      q("general", 7, "Which instrument has 88 keys?", ["Guitar", "Violin", "Piano", "Flute"], 2),
      q("general", 8, "What is the hardest natural substance?", ["Gold", "Iron", "Diamond", "Quartz"], 2),
      q("general", 9, "Which company created the iPhone?", ["Samsung", "Google", "Apple", "Microsoft"], 2),
    ],
  },
  {
    id: "science",
    label: "Science",
    emoji: "🔬",
    description: "Physics, biology, and chemistry basics",
    questions: [
      q("science", 0, "What gas do plants absorb from the air?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 2),
      q("science", 1, "What is the speed of light approximately?", ["300 km/s", "3,000 km/s", "300,000 km/s", "3,000,000 km/s"], 2),
      q("science", 2, "What is the powerhouse of the cell?", ["Nucleus", "Ribosome", "Mitochondria", "Membrane"], 2),
      q("science", 3, "What is H₂O commonly known as?", ["Salt", "Water", "Hydrogen", "Oxygen"], 1),
      q("science", 4, "Which organ pumps blood through the body?", ["Lungs", "Brain", "Liver", "Heart"], 3),
      q("science", 5, "What force keeps us on the ground?", ["Magnetism", "Friction", "Gravity", "Inertia"], 2),
      q("science", 6, "What is the boiling point of water at sea level (°C)?", ["90", "100", "110", "120"], 1),
      q("science", 7, "Which particle has a negative charge?", ["Proton", "Neutron", "Electron", "Photon"], 2),
      q("science", 8, "What is the closest star to Earth?", ["Proxima Centauri", "Sirius", "The Sun", "Betelgeuse"], 2),
      q("science", 9, "DNA stands for?", ["Deoxyribonucleic acid", "Dynamic nuclear acid", "Dual nitrogen acid", "Dense nucleic acid"], 0),
    ],
  },
  {
    id: "geography",
    label: "Geography",
    emoji: "🌍",
    description: "Countries, capitals, and landmarks",
    questions: [
      q("geography", 0, "What is the capital of Japan?", ["Seoul", "Beijing", "Tokyo", "Bangkok"], 2),
      q("geography", 1, "Which country has the largest population?", ["India", "USA", "China", "Indonesia"], 0),
      q("geography", 2, "The Nile River flows mainly through which continent?", ["Asia", "Africa", "Europe", "South America"], 1),
      q("geography", 3, "What is the tallest mountain in the world?", ["K2", "Kangchenjunga", "Mount Everest", "Makalu"], 2),
      q("geography", 4, "Which country is home to the Great Barrier Reef?", ["Indonesia", "Australia", "Philippines", "New Zealand"], 1),
      q("geography", 5, "What is the capital of Canada?", ["Toronto", "Vancouver", "Ottawa", "Montreal"], 2),
      q("geography", 6, "Which desert is the largest hot desert in the world?", ["Gobi", "Kalahari", "Sahara", "Arabian"], 2),
      q("geography", 7, "In which country would you find Machu Picchu?", ["Chile", "Peru", "Bolivia", "Ecuador"], 1),
      q("geography", 8, "What is the longest river in the world?", ["Amazon", "Yangtze", "Mississippi", "Nile"], 0),
      q("geography", 9, "Which European country is shaped like a boot?", ["Spain", "Greece", "Italy", "Portugal"], 2),
    ],
  },
  {
    id: "movies",
    label: "Movies & TV",
    emoji: "🎬",
    description: "Blockbusters, classics, and pop culture",
    questions: [
      q("movies", 0, "Who directed Jurassic Park?", ["James Cameron", "Steven Spielberg", "George Lucas", "Christopher Nolan"], 1),
      q("movies", 1, "In The Lion King, what is Simba's father called?", ["Scar", "Mufasa", "Rafiki", "Zazu"], 1),
      q("movies", 2, "Which series features a character named Eleven?", ["Dark", "Stranger Things", "The Witcher", "Wednesday"], 1),
      q("movies", 3, "What is the highest-grossing film of all time (unadjusted)?", ["Avatar", "Avengers: Endgame", "Titanic", "Star Wars: The Force Awakens"], 0),
      q("movies", 4, "Who played Jack in Titanic?", ["Brad Pitt", "Leonardo DiCaprio", "Tom Cruise", "Johnny Depp"], 1),
      q("movies", 5, "What is the name of the wizard school in Harry Potter?", ["Durmstrang", "Beauxbatons", "Hogwarts", "Ilvermorny"], 2),
      q("movies", 6, "Which superhero is also known as the Dark Knight?", ["Superman", "Spider-Man", "Batman", "Iron Man"], 2),
      q("movies", 7, "In Friends, what is the name of the coffee shop?", ["Central Perk", "Java Joe's", "Moondance", "The Grind"], 0),
      q("movies", 8, "Which animated film features a snowman named Olaf?", ["Moana", "Frozen", "Encanto", "Tangled"], 1),
      q("movies", 9, "What year was the first Star Wars film released?", ["1975", "1977", "1980", "1983"], 1),
    ],
  },
];

export function getBuiltinQuizTopic(topicId: string): QuizTopic | undefined {
  return QUIZ_TOPICS.find((topic) => topic.id === topicId);
}

export function validateQuizTopicData(topic: QuizTopic): string | null {
  if (!topic.label.trim()) return "Topic needs a label";

  if (topic.questions.length !== QUIZ_QUESTION_COUNT) {
    return `Topic "${topic.label}" must have exactly ${QUIZ_QUESTION_COUNT} questions`;
  }

  for (let i = 0; i < topic.questions.length; i++) {
    const question = topic.questions[i];
    if (!question.prompt.trim()) return `Topic "${topic.label}": question ${i + 1} needs a prompt`;
    if (question.options.length !== QUIZ_OPTION_COUNT) {
      return `Topic "${topic.label}": question ${i + 1} must have exactly ${QUIZ_OPTION_COUNT} options`;
    }
    if (question.options.some((option) => !option.trim())) {
      return `Topic "${topic.label}": question ${i + 1} needs all ${QUIZ_OPTION_COUNT} options`;
    }
    if (question.correctIndex < 0 || question.correctIndex >= QUIZ_OPTION_COUNT) {
      return `Topic "${topic.label}": question ${i + 1} needs a valid correct answer`;
    }
  }

  return null;
}

export function cloneQuizTopic(topic: QuizTopic): QuizTopic {
  return {
    ...topic,
    questions: topic.questions.map((question) => ({
      ...question,
      options: [...question.options] as [string, string, string, string],
    })),
  };
}

export function createEmptyCustomTopic(id = `custom-${Date.now()}`): QuizTopic {
  return {
    id,
    label: "New category",
    emoji: "📚",
    description: "",
    builtin: false,
    imported: true,
    questions: Array.from({ length: QUIZ_QUESTION_COUNT }, (_, index) => ({
      id: `${id}-q${index + 1}`,
      prompt: "",
      options: ["", "", "", ""] as [string, string, string, string],
      correctIndex: 0,
    })),
  };
}

/** @deprecated Use validateQuizTopicData with a resolved topic instead */
export function validateQuizTopic(topicId: string): string | null {
  const topic = getBuiltinQuizTopic(topicId);
  if (!topic) return "Unknown quiz topic";
  return validateQuizTopicData(topic);
}

/** @deprecated Use cloneQuizTopic with a resolved topic instead */
export function getQuizQuestionsForTopic(topicId: string): QuizQuestion[] | null {
  const topic = getBuiltinQuizTopic(topicId);
  if (!topic) return null;
  return cloneQuizTopic(topic).questions;
}

/** @deprecated Use getBuiltinQuizTopic or client getQuizTopicById */
export function getQuizTopic(topicId: string): QuizTopic | undefined {
  return getBuiltinQuizTopic(topicId);
}
