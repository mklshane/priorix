import { GoogleGenerativeAI } from "@google/generative-ai";
import { IFlashcard } from "@/types/flashcard";

const FLASHCARD_KEYS = (process.env.GEMINI_KEYS_FLASHCARD || process.env.GEMINI_KEY_FLASHCARD || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

export async function callWithKeyAndModelFallback(
  keys: string[],
  prompt: string,
  modelConfig?: { responseMimeType?: string; responseSchema?: any }
) {
  for (const key of keys) {
    const genAI = new GoogleGenerativeAI(key);
    for (const modelName of MODELS) {
      try {
        console.log(`Trying key ...${key.slice(-6)} with model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          ...(modelConfig ? { generationConfig: modelConfig } : {}),
        });
        const result = await model.generateContent(prompt);
        console.log(`Success with key ...${key.slice(-6)}, model: ${modelName}`);
        return result;
      } catch (error: any) {
        const is429 =
          error?.status === 429 ||
          error?.message?.includes("429") ||
          error?.message?.includes("Too Many Requests");

        if (is429) {
          console.log(`Key ...${key.slice(-6)} / ${modelName} rate limited, trying next...`);
          continue;
        }
        throw error;
      }
    }
  }
  throw new Error(
    "All API keys and models are rate limited. Please wait a few minutes and try again, or add more API keys from separate Google Cloud projects."
  );
}

export async function generateFlashcardsFromText(
  text: string,
  deckId: string
): Promise<IFlashcard[]> {
  try {

    const prompt = `
You are an expert educational content creator. Carefully read the following text and extract ALL individual facts, terms, people, places, events, dates, objects, and key concepts into flashcards.

Flashcard Rules:
1. Each flashcard must represent ONE atomic fact or term. Do NOT combine multiple definition into one flashcard.
2. The "term" field should be the keyword, name, person, concept, date, or object.
3. The "definition" field should be a short, factual, standalone description of that term. Start directly with the description. Do NOT include the term itself in the definition.
4. ENUMERATIONS / LISTS (steps, types, advantages, disadvantages, categories, components, parts, stages, causes/effects, methods, functions, principles, examples, or any grouped items):
   a. Create a **group flashcard** first. Use the heading or topic as the "term" and the definition as a **numbered list of only the item names**.
   b. Then create a **separate flashcard for each individual item** with a short factual definition.
   Example: 
     Text: "Advantages of Solar Energy: Speed - it processes data quickly, Cost - it reduces expenses, Reliability - it maintains uptime"
     Output:
     { "term": "Advantages of Solar Energy", "definition": "1. Speed\n2. Cost\n3. Reliability", "deck": "${deckId}" }
     { "term": "Speed (advantage of Solar Energy)", "definition": "It processes data quickly.", "deck": "${deckId}" }
     { "term": "Cost (advantage of Solar Energy)", "definition": "It reduces expenses.", "deck": "${deckId}" }
     { "term": "Reliability (advantage of Solar Energy)", "definition": "It maintains uptime.", "deck": "${deckId}" }
5. If a term appears multiple times in the text with different meanings, explanations, contexts, or facts, create SEPARATE flashcards for each distinct definition or fact.
6. A term is allowed to appear multiple times in the output as long as each flashcard contains a different single definition or fact.
7. NEVER combine multiple definitions, explanations, functions, examples, or characteristics into one flashcard — even if they refer to the same term.
8. Ensure that absolutely ALL individual facts are extracted. Do NOT summarize, compress, merge, or omit any information.
9. Return ONLY a JSON array in this exact format:

[
  {
    "term": "term here",
    "definition": "short factual definition here",
    "deck": "${deckId}"
  }
]

Text to analyze:
${text.substring(0, 30000)}
`;

    const result = await callWithKeyAndModelFallback(FLASHCARD_KEYS, prompt);
    const response = await result.response;
    const textResponse = response.text();

    const cleanedResponse = textResponse.replace(/```json|```/g, "").trim();
    const jsonStart = cleanedResponse.indexOf("[");
    const jsonEnd = cleanedResponse.lastIndexOf("]") + 1;

    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No JSON array found in response");
    }

    const jsonString = cleanedResponse.slice(jsonStart, jsonEnd);
    const rawFlashcards = JSON.parse(jsonString);

    // validate and filter flashcards
    const validFlashcards = rawFlashcards.filter(
      (flashcard: any) =>
        flashcard.term &&
        flashcard.definition &&
        typeof flashcard.term === "string" &&
        typeof flashcard.definition === "string"
    );

    if (validFlashcards.length === 0) {
      throw new Error("No valid flashcards generated");
    }

    // remove duplicates 
    const uniqueFlashcardsMap = new Map();
    validFlashcards.forEach((flashcard: any) => {
      const key = `${flashcard.term.trim().toLowerCase()}|${flashcard.definition
        .trim()
        .toLowerCase()}`;
      if (!uniqueFlashcardsMap.has(key)) {
        uniqueFlashcardsMap.set(key, {
          term: flashcard.term.trim(),
          definition: flashcard.definition.trim(),
          deck: deckId,
        });
      }
    });

    const uniqueFlashcards = Array.from(uniqueFlashcardsMap.values());

    if (uniqueFlashcards.length === 0) {
      throw new Error("No unique flashcards generated after deduplication");
    }

    console.log(
      `Generated ${uniqueFlashcards.length} unique flashcards from ${validFlashcards.length} total`
    );

    return uniqueFlashcards;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate flashcards");
  }
}
