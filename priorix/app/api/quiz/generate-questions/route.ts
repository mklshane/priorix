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
        { status: 400 }
      );
    }

    await ConnectDB();

    // Fetch flashcards
    const query = cardIds && cardIds.length > 0 
      ? { deck: deckId, _id: { $in: cardIds } }
      : { deck: deckId };
    
    const allCards = await Flashcard.find(query).lean();

    if (allCards.length === 0) {
      return NextResponse.json(
        { error: "No flashcards found" },
        { status: 404 }
      );
    }

    // Shuffle and select cards
    const shuffled = allCards.sort(() => Math.random() - 0.5);
    const selectedCards = shuffled.slice(0, Math.min(questionCount, allCards.length));

    // Generate questions with limited AI usage to avoid quota
    // Use AI for only a few questions, fallback for the rest
    const questions: QuizQuestion[] = [];
    const maxAICalls = Math.min(5, Math.floor(selectedCards.length / 2)); // Use AI for half or max 5
    let aiCallsUsed = 0;

    for (let i = 0; i < selectedCards.length; i++) {
      const card = selectedCards[i];
      // Randomly select quiz type from allowed types
      const quizType: QuizType = quizTypes[Math.floor(Math.random() * quizTypes.length)];
      
      // Use AI strategically - first few questions and distributed throughout
      const shouldUseAI = aiCallsUsed < maxAICalls && (i < maxAICalls || Math.random() > 0.7);
      
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
      { status: 500 }
    );
  }
}

async function generateMCQ(card: any, allCards: any[], tryAI: boolean = false): Promise<QuizQuestion> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
Create a multiple choice question from this flashcard:
Term: ${card.term}
Definition: ${card.definition}

Generate a complete MCQ with:
1. A clear, properly formatted question (not just the term)
2. Four answer options (one correct, three plausible but incorrect)
3. A detailed explanation of why the answer is correct

Return ONLY valid JSON in this EXACT format with no markdown:
{
  "question": "What is [concept]?" or "Which of the following describes [concept]?",
  "options": ["correct answer", "wrong 1", "wrong 2", "wrong 3"],
  "correctAnswer": "correct answer",
  "explanation": "Detailed explanation of why this is correct and what the concept means"
}

Rules:
- Make the question text natural and educational
- Wrong answers should be plausible but clearly incorrect
- Explanation should teach, not just repeat the definition
- NO markdown formatting, NO code blocks, ONLY the JSON object
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

      if (aiData.question && aiData.options && Array.isArray(aiData.options) && aiData.options.length === 4 && aiData.correctAnswer && aiData.explanation) {
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
      questionText: "Not enough cards in this deck to generate a meaningful MCQ. Please add more cards.",
      options: [],
      correctAnswer: "",
      type: "mcq",
      explanation: "A minimum of 4 cards is recommended for MCQ quizzes.",
    };
  }

  // Choose template: term-to-definition or definition-to-term
  const useDefinitionToTerm = Math.random() > 0.5;
  const otherCards = allCards.filter((c) => c._id.toString() !== card._id.toString());

  // Distractor selection: avoid definitions too similar to correct answer
  let distractors: string[] = [];
  if (useDefinitionToTerm) {
    // Definition-to-term: correct answer is card.term, distractors are other card terms
    distractors = otherCards
      .map((c) => c.term)
      .filter((t) => t !== card.term)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    // Remove duplicates
    distractors = Array.from(new Set(distractors));
    const options = [card.term, ...distractors].sort(() => Math.random() - 0.5);
    return {
      cardId: card._id.toString(),
      questionText: `Which term matches this definition?\n${card.definition}`,
      options,
      correctAnswer: card.term,
      type: "mcq",
      explanation: `The correct answer is: ${card.term}. This term matches the given definition.`,
    };
  } else {
    // Term-to-definition: correct answer is card.definition, distractors are other card definitions
    distractors = otherCards
      .map((c) => c.definition)
      .filter((d) => d !== card.definition && d.length > 0 && Math.abs(d.length - card.definition.length) > 3)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    // Remove duplicates
    distractors = Array.from(new Set(distractors));
    // If not enough distractors, fill with random definitions (no generic distractors)
    while (distractors.length < 3) {
      const randomDef = otherCards[Math.floor(Math.random() * otherCards.length)].definition;
      if (!distractors.includes(randomDef) && randomDef !== card.definition) {
        distractors.push(randomDef);
      }
    }
    const options = [card.definition, ...distractors].sort(() => Math.random() - 0.5);
    // Remove nearly identical options
    const uniqueOptions = Array.from(new Set(options));
    return {
      cardId: card._id.toString(),
      questionText: card.term.endsWith("?") ? card.term : `What is ${card.term}?`,
      options: uniqueOptions,
      correctAnswer: card.definition,
      type: "mcq",
      explanation: `The correct answer is: ${card.definition}. This is the definition of ${card.term}.`,
    };
  }
  }

// Helper function to create natural-sounding statements
function createNaturalStatement(term: string, definition: string): string {
  const termLower = term.toLowerCase();
  
  // Check for "What is/are..." patterns
  if (termLower.startsWith("what is")) {
    const subject = term.substring(7).trim();
    return `${subject} is ${definition}`;
  }
  
  if (termLower.startsWith("what are")) {
    const subject = term.substring(8).trim();
    return `${subject} are ${definition}`;
  }
  
  // Check for question marks - convert to statement
  if (term.endsWith("?")) {
    return `${term.slice(0, -1)}: ${definition}`;
  }
  
  // Default: Simple subject-verb-object format
  // Check if definition is a verb phrase or noun phrase
  const defLower = definition.toLowerCase();
  if (defLower.startsWith("the ") || defLower.startsWith("a ") || defLower.startsWith("an ")) {
    return `${term} is ${definition}`;
  } else if (defLower.match(/^(to |for |by |in |on |at )/)) {
    return `${term} is used ${definition}`;
  } else {
    // Most generic format
    return `${term}: ${definition}`;
  }
}

async function generateTrueFalse(card: any, tryAI: boolean = false, allCards?: any[]): Promise<QuizQuestion> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    // Randomly decide if this will be a true or false statement
    const isTrue = Math.random() > 0.5;

    const prompt = `
Create a True/False question from this flashcard:
Term: ${card.term}
Definition: ${card.definition}

Generate a ${isTrue ? "TRUE" : "FALSE"} statement with:
1. A clear, declarative statement (not a question)
2. A detailed explanation of why it's true or false

${isTrue 
  ? "Make the statement correctly describe the term/concept."
  : "Make the statement contain a plausible but incorrect description."}

Return ONLY valid JSON in this EXACT format with no markdown:
{
  "statement": "Natural declarative statement about the concept",
  "correctAnswer": "${isTrue ? "True" : "False"}",
  "explanation": "Detailed explanation of why this statement is ${isTrue ? "true" : "false"} and what the actual concept means"
}

Rules:
- Statement should be natural and educational (like real quiz statements)
- For false statements, make them believable but clearly wrong
- Explanation should teach the concept, not just say "true" or "false"
- NO markdown formatting, NO code blocks, ONLY the JSON object
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
  // If deck is too small, return a warning question
  if (!allCards || allCards.length < 2) {
    return {
      cardId: card._id.toString(),
      questionText: "Not enough cards in this deck to generate a meaningful True/False question. Please add more cards.",
      options: ["True", "False"],
      correctAnswer: "",
      type: "true-false",
      explanation: "A minimum of 2 cards is recommended for True/False quizzes.",
    };
  }

  const otherCards = allCards.filter(c => c._id.toString() !== card._id.toString());
  // Randomly decide true or false
  const isTrue = Math.random() > 0.5;
  if (isTrue) {
    // True statement
    const statement = createNaturalStatement(card.term, card.definition);
    return {
      cardId: card._id.toString(),
      questionText: statement,
      options: ["True", "False"],
      correctAnswer: "True",
      type: "true-false",
      explanation: `This statement is true. ${card.term} is correctly described as: ${card.definition}.`,
    };
  } else {
    // False statement: pick a definition from another card that is not too similar
    let falseDef = "";
    for (const oc of otherCards) {
      if (oc.definition !== card.definition && oc.definition.length > 0 && Math.abs(oc.definition.length - card.definition.length) > 3) {
        falseDef = oc.definition;
        break;
      }
    }
    // If none found, pick random
    if (!falseDef && otherCards.length > 0) {
      falseDef = otherCards[Math.floor(Math.random() * otherCards.length)].definition;
    }
    // Fallback to generic if still not found
    if (!falseDef) {
      falseDef = "An unrelated concept.";
    }
    const falseStatement = createNaturalStatement(card.term, falseDef);
    return {
      cardId: card._id.toString(),
      questionText: falseStatement,
      options: ["True", "False"],
      correctAnswer: "False",
      type: "true-false",
      explanation: `This statement is false. ${card.term} is actually: ${card.definition}. The statement incorrectly describes it as something else.`,
    };
  }
}
