import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConnectDB } from "@/lib/config/db";
import Flashcard from "@/lib/models/Flashcard";
import { QuizType, QuizQuestion } from "@/types/quiz";

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

    // Shuffle and select cards
    const shuffled = allCards.sort(() => Math.random() - 0.5);
    const selectedCards = shuffled.slice(
      0,
      Math.min(questionCount, allCards.length),
    );

    // Generate questions with limited AI usage to avoid quota
    // Use AI for only a few questions, fallback for the rest
    const questions: QuizQuestion[] = [];
    const maxAICalls = Math.min(5, Math.floor(selectedCards.length / 2)); // Use AI for half or max 5
    let aiCallsUsed = 0;

    for (let i = 0; i < selectedCards.length; i++) {
      const card = selectedCards[i];
      // Randomly select quiz type from allowed types
      const quizType: QuizType =
        quizTypes[Math.floor(Math.random() * quizTypes.length)];

      // Use AI strategically - first few questions and distributed throughout
      const shouldUseAI =
        aiCallsUsed < maxAICalls && (i < maxAICalls || Math.random() > 0.7);

      if (quizType === "mcq") {
        const mcqQuestion = shouldUseAI
          ? await generateMCQ(card, allCards, true)
          : generateMCQFallback(card, allCards);
        questions.push(mcqQuestion);
        if (shouldUseAI) aiCallsUsed++;
      } else {
        const tfQuestion = shouldUseAI
          ? await generateTrueFalse(card, true, allCards)
          : generateTrueFalseFallback(card, allCards);
        questions.push(tfQuestion);
        if (shouldUseAI) aiCallsUsed++;
      }
    }

    // Shuffle questions
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

async function generateMCQ(
  card: any,
  allCards: any[],
  tryAI: boolean = false,
): Promise<QuizQuestion> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
You are an expert test-maker. Create a high-quality, college-level multiple-choice question based on this flashcard:
Term: ${card.term}
Definition: ${card.definition}

Rules for the MCQ:
1. The question must be a clear, natural-sounding sentence that tests the user's understanding of the concept (e.g., scenarios, direct questions, or "Which of the following...").
2. Provide exactly 4 options.
3. The correct answer must be one of the options and accurately reflect the flashcard.
4. The 3 incorrect options (distractors) must be highly plausible, related to the same subject area, but definitively incorrect. Do not use silly, obvious, or throwaway options.
5. Provide an explanation that teaches the user *why* the answer is correct and briefly clarifies why the distractors are wrong.
6. Return ONLY valid JSON in this EXACT format with NO markdown formatting (\`\`\`json) and NO extra text:

{
  "question": "The educational question testing the concept",
  "options": ["correct answer", "plausible wrong 1", "plausible wrong 2", "plausible wrong 3"],
  "correctAnswer": "correct answer",
  "explanation": "Detailed educational explanation of the correct answer."
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().trim();

    // Clean up response
    textResponse = textResponse.replace(/```json|```/g, "").trim();
    const jsonStart = textResponse.indexOf("{");
    const jsonEnd = textResponse.lastIndexOf("}") + 1;

    if (jsonStart !== -1 && jsonEnd > 0) {
      const jsonString = textResponse.slice(jsonStart, jsonEnd);
      const aiData = JSON.parse(jsonString);

      if (
        aiData.question &&
        aiData.options &&
        Array.isArray(aiData.options) &&
        aiData.options.length === 4 &&
        aiData.correctAnswer &&
        aiData.explanation
      ) {
        return {
          cardId: card._id.toString(),
          questionText: aiData.question,
          options: aiData.options,
          correctAnswer: aiData.correctAnswer,
          type: "mcq",
          explanation: aiData.explanation,
        };
      }
    }

    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("AI MCQ generation failed, using fallback:", error);
    return generateMCQFallback(card, allCards);
  }
}

function generateMCQFallback(card: any, allCards: any[]): QuizQuestion {
  // If deck is too small, return a warning question
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
    // Find distractors that are somewhat similar in length to make them plausible
    const targetLength = card.definition.length;
    let distractors = otherCards
      .map((c) => c.definition)
      .filter((d) => d !== card.definition && d.trim().length > 0)
      // Sort by length difference so distractors look visually similar to the answer
      .sort(
        (a, b) =>
          Math.abs(a.length - targetLength) - Math.abs(b.length - targetLength),
      )
      .slice(0, 5) // Take top 5 closest in length
      .sort(() => Math.random() - 0.5) // Shuffle them
      .slice(0, 3); // Pick 3

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

// Helper function to create safe, grammatically neutral test statements
function buildTestStatement(term: string, definition: string): string {
  let cleanDef = definition.trim();
  // Lowercase the first letter if it's a standard word to make it flow better,
  // but avoid lowercasing if it looks like an acronym (e.g., "NASA")
  if (
    cleanDef.length > 1 &&
    cleanDef[0] === cleanDef[0].toUpperCase() &&
    cleanDef[1] === cleanDef[1].toLowerCase()
  ) {
    cleanDef = cleanDef[0].toLowerCase() + cleanDef.slice(1);
  }

  // Using quotes and 'refers to' or 'is defined as' avoids awkward subject-verb mismatches
  return `The term "${term.trim()}" is defined as: ${cleanDef}`;
}

async function generateTrueFalse(
  card: any,
  tryAI: boolean = false,
  allCards?: any[],
): Promise<QuizQuestion> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Randomly decide if this will be a true or false statement
    const isTrue = Math.random() > 0.5;

    const prompt = `
You are an expert test-maker. Create a True/False question based on this flashcard:
Term: ${card.term}
Definition: ${card.definition}

You must generate a ${isTrue ? "TRUE" : "FALSE"} statement.

Rules for the True/False statement:
1. Write a clear, declarative sentence (not a question).
2. If TRUE, the statement must accurately describe the term based on the definition in a natural way.
3. If FALSE, the statement must substitute a key detail with a common misconception or a related but incorrect fact. It should sound highly plausible to a student learning the material. Do not make the false statement absurd or overly obvious.
4. Provide an explanation that clarifies the actual truth and reinforces the correct definition.
5. Return ONLY valid JSON in this EXACT format with NO markdown formatting (\`\`\`json) and NO extra text:

{
  "statement": "The natural, declarative statement here",
  "correctAnswer": "${isTrue ? "True" : "False"}",
  "explanation": "Detailed explanation of why this statement is ${isTrue ? "true" : "false"}, including the actual correct definition of the concept."
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().trim();

    // Clean up response
    textResponse = textResponse.replace(/```json|```/g, "").trim();
    const jsonStart = textResponse.indexOf("{");
    const jsonEnd = textResponse.lastIndexOf("}") + 1;

    if (jsonStart !== -1 && jsonEnd > 0) {
      const jsonString = textResponse.slice(jsonStart, jsonEnd);
      const aiData = JSON.parse(jsonString);

      if (aiData.statement && aiData.correctAnswer && aiData.explanation) {
        return {
          cardId: card._id.toString(),
          questionText: aiData.statement,
          options: ["True", "False"],
          correctAnswer: aiData.correctAnswer,
          type: "true-false",
          explanation: aiData.explanation,
        };
      }
    }

    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("AI True/False generation failed, using fallback:", error);
    return generateTrueFalseFallback(card, allCards);
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
    // False statement: pick a definition from another card that is similar in length
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
