export type GuessCategory = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  items: string[];
};

export const GUESS_CATEGORIES: GuessCategory[] = [
  {
    id: "number",
    label: "Numbers",
    emoji: "🔢",
    description: "Guess a number between 1 and 100",
    items: Array.from({ length: 100 }, (_, i) => String(i + 1)),
  },
  {
    id: "cars",
    label: "Cars",
    emoji: "🚗",
    description: "Famous car brands and models",
    items: [
      "Toyota Camry",
      "Honda Civic",
      "Ford Mustang",
      "Tesla Model 3",
      "BMW M3",
      "Mercedes-Benz S-Class",
      "Porsche 911",
      "Chevrolet Corvette",
      "Audi A4",
      "Volkswagen Golf",
      "Nissan GT-R",
      "Jeep Wrangler",
      "Ferrari F40",
      "Lamborghini Huracán",
      "Subaru WRX",
    ],
  },
  {
    id: "food",
    label: "Food",
    emoji: "🍕",
    description: "Popular dishes and ingredients",
    items: [
      "Pizza",
      "Sushi",
      "Tacos",
      "Burger",
      "Pasta",
      "Ramen",
      "Curry",
      "Steak",
      "Salad",
      "Ice Cream",
      "Pancakes",
      "Fried Rice",
      "Sandwich",
      "Chocolate Cake",
      "Pad Thai",
    ],
  },
  {
    id: "countries",
    label: "Countries",
    emoji: "🌍",
    description: "Nations from around the world",
    items: [
      "Japan",
      "Brazil",
      "Canada",
      "Germany",
      "Australia",
      "India",
      "Mexico",
      "France",
      "Egypt",
      "South Korea",
      "Italy",
      "Nigeria",
      "Argentina",
      "Thailand",
      "Sweden",
    ],
  },
  {
    id: "animals",
    label: "Animals",
    emoji: "🦁",
    description: "Creatures great and small",
    items: [
      "Lion",
      "Dolphin",
      "Penguin",
      "Elephant",
      "Tiger",
      "Giraffe",
      "Kangaroo",
      "Panda",
      "Eagle",
      "Octopus",
      "Wolf",
      "Butterfly",
      "Shark",
      "Owl",
      "Cheetah",
    ],
  },
  {
    id: "movies",
    label: "Movies",
    emoji: "🎬",
    description: "Classic and popular films",
    items: [
      "The Matrix",
      "Titanic",
      "Inception",
      "Frozen",
      "Jurassic Park",
      "The Lion King",
      "Avatar",
      "Toy Story",
      "Harry Potter",
      "Star Wars",
      "Finding Nemo",
      "The Godfather",
      "Spider-Man",
      "Moana",
      "Interstellar",
    ],
  },
];

export function pickRandomItem(category: GuessCategory): string {
  const index = Math.floor(Math.random() * category.items.length);
  return category.items[index];
}

export function normalizeAnswer(answer: string): string {
  return answer.trim();
}

export function normalizeGuess(guess: string): string {
  return normalizeAnswer(guess).toLowerCase();
}

export function isCorrectGuess(guess: string, answer: string): boolean {
  const normalizedGuess = normalizeGuess(guess);
  const normalizedAnswer = normalizeGuess(answer);
  if (!normalizedGuess || !normalizedAnswer) return false;
  return normalizedGuess === normalizedAnswer;
}
