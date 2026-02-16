import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { ConnectDB } from "@/lib/config/db";
import Flashcard from "@/lib/models/Flashcard";
import { QuizType, QuizQuestion } from "@/types/quiz";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_QUIZ!);

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
    const maxAICalls = selectedCards.length;

    const aiCards = cardsWithAssignedTypes.slice(0, maxAICalls);
    const fallbackCards = cardsWithAssignedTypes.slice(maxAICalls);

    let questions: QuizQuestion[] = [];
    const questionSourceMap = new Map<string, "ai" | "fallback">();
    const fallbackReasonMap = new Map<string, string>();

    // 1. Generate AI questions in ONE single bulk request
    if (aiCards.length > 0) {
      try {
        const aiQuestions = await generateBulkQuestions(aiCards);
        questions.push(...aiQuestions);
        aiQuestions.forEach((q) => {
          questionSourceMap.set(q.cardId, "ai");
        });

        // Safety net: If AI returned fewer questions than asked, fallback the missing ones
        if (aiQuestions.length < aiCards.length) {
          console.warn(
            `Gemini returned fewer questions than requested. Expected=${aiCards.length}, Got=${aiQuestions.length}`,
          );

          const generatedIds = new Set(aiQuestions.map((q) => q.cardId));

          const missingCards = aiCards.filter(
            (c) => !generatedIds.has(c._id.toString()),
          );

          missingCards.forEach((c) => {
            fallbackReasonMap.set(
              c._id.toString(),
              "Gemini returned no question for this cardId (missing from response)",
            );
          });

          fallbackCards.push(...missingCards);
        }
      } catch (error: any) {
        const status = error?.status;
        const retryDelay =
          error?.errorDetails?.find((d: any) =>
            d["@type"]?.includes("RetryInfo"),
          )?.retryDelay ?? null;

        let reason = "Gemini bulk request failed (exception thrown)";

        if (status === 429) {
          reason = `Gemini rate-limited / quota exceeded (429)${
            retryDelay ? ` | Retry after: ${retryDelay}` : ""
          }`;
        }

        console.error(
          "Bulk AI generation failed, falling back completely:",
          error,
        );

        aiCards.forEach((c) => {
          fallbackReasonMap.set(c._id.toString(), reason);
        });

        fallbackCards.push(...aiCards);
      }
    }

    // 2. Generate Fallback questions synchronously for the remaining cards
    for (const card of fallbackCards) {
      questionSourceMap.set(card._id.toString(), "fallback");

      // If no reason already exists, it means the card was never sent to Gemini
      if (!fallbackReasonMap.has(card._id.toString())) {
        fallbackReasonMap.set(
          card._id.toString(),
          "Card was not sent to Gemini (quota batching / maxAICalls limit)",
        );
      }

      if (card.assignedType === "mcq") {
        questions.push(generateMCQFallback(card, allCards));
      } else {
        questions.push(generateTrueFalseFallback(card, allCards));
      }
    }

    // Shuffle final combined questions so the user doesn't realize which ones were AI vs Fallback
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    console.log("===== FINAL QUIZ QUESTIONS RETURNED (WITH SOURCE) =====");

    (shuffledQuestions as QuizQuestion[]).forEach(
      (q: QuizQuestion, i: number) => {
        const source = questionSourceMap.get(q.cardId) ?? "unknown";
        const reason =
          source === "fallback" ? fallbackReasonMap.get(q.cardId) : undefined;

        console.log(
          `[${i + 1}] (${q.type}) [${source.toUpperCase()}] cardId=${q.cardId}\n` +
            `Q: ${q.questionText}\n` +
            `Correct: ${q.correctAnswer}\n` +
            `Options: ${q.options.join(" | ")}\n` +
            (reason ? `Fallback reason: ${reason}\n` : "") +
            `---`,
        );
      },
    );

    console.log("===== END FINAL QUIZ QUESTIONS RETURNED =====");

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
  // 1. Define the exact JSON structure you want Gemini to return
  const quizQuestionSchema: Schema = {
    type: SchemaType.ARRAY,
    description:
      "An array of generated quiz questions based on the provided flashcards.",
    items: {
      type: SchemaType.OBJECT,
      properties: {
        cardId: {
          type: SchemaType.STRING,
          description: "The exact id provided in the input",
        },
        questionText: {
          type: SchemaType.STRING,
          description: "The generated question or true/false statement",
        },
        options: {
          type: SchemaType.ARRAY,
          description:
            "Exactly 4 options for mcq, or exactly ['True', 'False'] for true-false",
          items: {
            type: SchemaType.STRING,
          },
        },
        correctAnswer: {
          type: SchemaType.STRING,
          description: "The exact string of the correct option",
        },
        type: {
          type: SchemaType.STRING,
          description: "Must be either 'mcq' or 'true-false'",
        },
        explanation: {
          type: SchemaType.STRING,
          description: "Detailed explanation of why the answer is correct.",
        },
      },
      // Force the model to include every single field
      required: [
        "cardId",
        "questionText",
        "options",
        "correctAnswer",
        "type",
        "explanation",
      ],
    },
  };

  // 2. Pass the schema into the model's generation config
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: quizQuestionSchema,
    },
  });

  const promptData = cards.map((card) => ({
    id: card._id.toString(),
    term: card.term,
    definition: card.definition,
    requestedType: card.assignedType,
  }));

  // 3. Simplified prompt! You no longer need to explain JSON formatting rules.
  const prompt = `
You are an expert educational test-maker. Generate a college-level question for each flashcard based on its "requestedType" ("mcq" or "true-false").

========================
QUALITY RULES (IMPORTANT)
========================
- Difficulty must be COLLEGE-LEVEL (not basic definition recall).
- Questions must test understanding, application, or discrimination between similar concepts.
- Avoid vague wording like: "Which is correct?" or "What is true?"
- Avoid trick questions and double negatives.
- Avoid "All of the above" and "None of the above".
- The question must be answerable from the flashcard content.
- Do NOT include references to "flashcard" in the question.
- The explanation must clearly justify why the correct answer is correct.

========================
MCQ RULES
========================
If requestedType is "mcq":
- Provide exactly 4 answer choices in "options".
- Exactly ONE option must be correct.
- Distractors must be highly plausible and related, but clearly wrong.
- "correctAnswer" MUST match one of the options EXACTLY.

========================
TRUE/FALSE RULES
========================
If requestedType is "true-false":
- The question MUST be a declarative statement.
- Randomly decide if it should be True or False.
- If TRUE: statement must be fully accurate.
- If FALSE: replace ONE key detail with a realistic misconception.
- "options" MUST be exactly ["True", "False"].
- "correctAnswer" MUST be either "True" or "False".

Input Flashcards:
${JSON.stringify(promptData, null, 2)}
`;

  const result = await model.generateContent(prompt);

  // 4. Clean and direct parsing!
  // Because we set responseMimeType to application/json, it returns pure JSON. No markdown ticks (```) will be included.
  const textResponse = result.response.text();

  try {
    const aiData = JSON.parse(textResponse);
    console.log("===== GEMINI GENERATED QUESTIONS =====");
    aiData.forEach((q: QuizQuestion, i: number) => {
      console.log(
        `[${i + 1}] (${q.type}) cardId=${q.cardId}\nQ: ${q.questionText}\nCorrect: ${q.correctAnswer}\nOptions: ${q.options.join(" | ")}\n---`,
      );
    });
    console.log("===== END GEMINI GENERATED QUESTIONS =====");
    return aiData as QuizQuestion[];
  } catch (error) {
    console.error("Failed to parse AI JSON:", textResponse);
    throw new Error("Invalid AI response format.");
  }
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
