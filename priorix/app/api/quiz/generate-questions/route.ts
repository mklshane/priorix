import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConnectDB } from "@/lib/config/db";
import Flashcard from "@/lib/models/Flashcard";
import { QuizType, QuizQuestion } from "@/types/quiz";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { deckId, questionCount, quizTypes, cardIds } = await req.json();

    if (!deckId || !questionCount || !quizTypes || quizTypes.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await ConnectDB();

    // Fetch flashcards
    const query =
      cardIds && cardIds.length > 0
        ? { deck: deckId, _id: { $in: cardIds } }
        : { deck: deckId };

    const allCards = await Flashcard.find(query).lean();

    if (allCards.length === 0) {
      return NextResponse.json(
        { error: "No flashcards found" },
        { status: 404 },
      );
    }

    // Shuffle and select exactly the number of cards requested
    const shuffled = allCards.sort(() => Math.random() - 0.5);
    const selectedCards = shuffled.slice(
      0,
      Math.min(questionCount, allCards.length),
    );

    // Pre-assign a quiz type to each selected card based on allowed types
    const cardsWithAssignedTypes = selectedCards.map((card) => ({
      ...card,
      assignedType: quizTypes[
        Math.floor(Math.random() * quizTypes.length)
      ] as QuizType,
    }));

    // Strategically split cards: Send a maximum of 5 to the AI to save quota, fallback for the rest
    const maxAICalls = Math.min(5, Math.floor(selectedCards.length / 2));
    const aiCards = cardsWithAssignedTypes.slice(0, maxAICalls);
    const fallbackCards = cardsWithAssignedTypes.slice(maxAICalls);

    let questions: QuizQuestion[] = [];

    // 1. Generate AI questions in ONE single bulk request
    if (aiCards.length > 0) {
      try {
        const aiQuestions = await generateBulkQuestions(aiCards);
        questions.push(...aiQuestions);

        // Safety net: If AI returned fewer questions than asked, fallback the missing ones
        if (aiQuestions.length < aiCards.length) {
          const generatedIds = new Set(aiQuestions.map((q) => q.cardId));
          const missingCards = aiCards.filter(
            (c) => !generatedIds.has(c._id.toString()),
          );
          fallbackCards.push(...missingCards);
        }
      } catch (error) {
        console.error(
          "Bulk AI generation failed, falling back completely:",
          error,
        );
        // If the whole AI batch fails, push all of them to the fallback pipeline
        fallbackCards.push(...aiCards);
      }
    }

    // 2. Generate Fallback questions synchronously for the remaining cards
    for (const card of fallbackCards) {
      if (card.assignedType === "mcq") {
        questions.push(generateMCQFallback(card, allCards));
      } else {
        questions.push(generateTrueFalseFallback(card, allCards));
      }
    }

    // Shuffle final combined questions so the user doesn't realize which ones were AI vs Fallback
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

    return NextResponse.json({ questions: shuffledQuestions });
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 },
    );
  }
}

// --- BULK GENERATION FUNCTION ---
async function generateBulkQuestions(cards: any[]): Promise<QuizQuestion[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  // Format the input data cleanly for the prompt
  const promptData = cards.map((card) => ({
    id: card._id.toString(),
    term: card.term,
    definition: card.definition,
    requestedType: card.assignedType,
  }));

  const prompt = `
You are an expert educational test-maker. I am providing you with a list of flashcards. 
For each flashcard, you must generate a high-quality, college-level question based on its "requestedType" (either "mcq" or "true-false").

Rules for MCQ ("mcq"):
1. Provide a clear question or scenario testing the concept.
2. Provide exactly 4 options in an array. The correct answer must be one of them.
3. The 3 incorrect options (distractors) must be highly plausible, related to the subject, but definitively wrong.

Rules for True/False ("true-false"):
1. Write a clear, declarative statement (not a question).
2. Randomly decide to make it true or false.
3. If TRUE, accurately describe the term.
4. If FALSE, substitute a key detail with a plausible misconception. Do not make it absurdly obvious.
5. The "options" array MUST be exactly ["True", "False"].

Return ONLY a valid JSON array of objects matching this exact structure, with NO markdown formatting (\`\`\`json) and NO extra text:

[
  {
    "cardId": "the exact id provided in the input",
    "questionText": "The question or statement here",
    "options": ["option 1", "option 2", "option 3", "option 4"], // OR ["True", "False"]
    "correctAnswer": "the exact correct option string",
    "type": "mcq", // or "true-false"
    "explanation": "Detailed explanation of why the answer is correct."
  }
]

Input Flashcards:
${JSON.stringify(promptData, null, 2)}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let textResponse = response.text().trim();

  // Clean up response markdown blocks if the AI includes them anyway
  textResponse = textResponse.replace(/```json|```/g, "").trim();
  const jsonStart = textResponse.indexOf("[");
  const jsonEnd = textResponse.lastIndexOf("]") + 1;

  if (jsonStart !== -1 && jsonEnd > 0) {
    const jsonString = textResponse.slice(jsonStart, jsonEnd);
    const aiData = JSON.parse(jsonString);

    if (Array.isArray(aiData)) {
      return aiData as QuizQuestion[];
    }
  }
  throw new Error("Invalid AI response format: Expected an array.");
}

// --- FALLBACK FUNCTIONS ---

function generateMCQFallback(card: any, allCards: any[]): QuizQuestion {
  if (allCards.length < 4) {
    return {
      cardId: card._id.toString(),
      questionText:
        "Not enough cards in this deck to generate a meaningful MCQ. Please add more cards.",
      options: [],
      correctAnswer: "",
      type: "mcq",
      explanation: "A minimum of 4 cards is recommended for MCQ quizzes.",
    };
  }

  const useDefinitionToTerm = Math.random() > 0.5;
  const otherCards = allCards.filter(
    (c) => c._id.toString() !== card._id.toString(),
  );

  if (useDefinitionToTerm) {
    // Definition-to-term
    let distractors = otherCards
      .map((c) => c.term)
      .filter((t) => t !== card.term)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    distractors = Array.from(new Set(distractors));
    const options = [card.term, ...distractors].sort(() => Math.random() - 0.5);

    return {
      cardId: card._id.toString(),
      questionText: `Which of the following terms matches this description?\n\n"${card.definition}"`,
      options,
      correctAnswer: card.term,
      type: "mcq",
      explanation: `The correct answer is ${card.term}.`,
    };
  } else {
    // Term-to-definition
    const targetLength = card.definition.length;
    let distractors = otherCards
      .map((c) => c.definition)
      .filter((d) => d !== card.definition && d.trim().length > 0)
      .sort(
        (a, b) =>
          Math.abs(a.length - targetLength) - Math.abs(b.length - targetLength),
      )
      .slice(0, 5)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    while (distractors.length < 3) {
      distractors.push("None of the above.");
    }

    const options = [card.definition, ...distractors].sort(
      () => Math.random() - 0.5,
    );
    const uniqueOptions = Array.from(new Set(options));

    return {
      cardId: card._id.toString(),
      questionText: `Which of the following best describes "${card.term}"?`,
      options: uniqueOptions,
      correctAnswer: card.definition,
      type: "mcq",
      explanation: `The correct answer is: ${card.definition}.`,
    };
  }
}

function generateTrueFalseFallback(card: any, allCards?: any[]): QuizQuestion {
  if (!allCards || allCards.length < 2) {
    return {
      cardId: card._id.toString(),
      questionText:
        "Not enough cards in this deck to generate a meaningful True/False question. Please add more cards.",
      options: ["True", "False"],
      correctAnswer: "",
      type: "true-false",
      explanation:
        "A minimum of 2 cards is recommended for True/False quizzes.",
    };
  }

  const otherCards = allCards.filter(
    (c) => c._id.toString() !== card._id.toString(),
  );
  const isTrue = Math.random() > 0.5;

  if (isTrue) {
    return {
      cardId: card._id.toString(),
      questionText: buildTestStatement(card.term, card.definition),
      options: ["True", "False"],
      correctAnswer: "True",
      type: "true-false",
      explanation: `Correct! "${card.term}" is accurately described by this definition.`,
    };
  } else {
    const targetLength = card.definition.length;
    const sortedOtherCards = [...otherCards]
      .filter((c) => c.definition && c.definition.trim().length > 0)
      .sort(
        (a, b) =>
          Math.abs(a.definition.length - targetLength) -
          Math.abs(b.definition.length - targetLength),
      );

    const falseCard = sortedOtherCards[0] || otherCards[0];
    const falseStatement = buildTestStatement(card.term, falseCard.definition);

    return {
      cardId: card._id.toString(),
      questionText: falseStatement,
      options: ["True", "False"],
      correctAnswer: "False",
      type: "true-false",
      explanation: `False. That is actually the definition for "${falseCard.term}". The correct definition of "${card.term}" is: ${card.definition}`,
    };
  }
}

function buildTestStatement(term: string, definition: string): string {
  let cleanDef = definition.trim();
  if (
    cleanDef.length > 1 &&
    cleanDef[0] === cleanDef[0].toUpperCase() &&
    cleanDef[1] === cleanDef[1].toLowerCase()
  ) {
    cleanDef = cleanDef[0].toLowerCase() + cleanDef.slice(1);
  }
  return `The term "${term.trim()}" is defined as: ${cleanDef}`;
}
