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
You are an expert educational content creator. Carefully read the following text and extract ALL key terms, names, people, events, concepts, objects, and important ideas into flashcards.

Strict Rules for Generation:
- Return ONLY a JSON array in this exact format, with NO markdown formatting (\`\`\`json) and NO extra text:
[
  {
    "term": "term here",
    "definition": "definition here",
    "deck": "${deckId}"
  }
]
- Include ALL terms and key ideas found in the text. Do not omit any.
- Ensure that all terms (key ideas, concepts, names, dates, events, objects) are included.
- Keep the exact meaning from the material, but format the definition as a clear, standalone explanation.
- ABSOLUTELY DO NOT include the "term" itself inside the "definition".
- Write the definition naturally by starting directly with the description or by using pronouns (e.g., "It is...", "This process...", "A person who...").
- DO NOT create duplicate flashcards. Each flashcard must be unique.
- If there are multiple definitions for the same term, combine them into one flashcard with a comprehensive definition.

Special Rule for Enumerations (VERY IMPORTANT):
When the text contains lists, steps, stages, types, advantages, disadvantages, characteristics, features, components, parts, categories, principles, factors, causes, effects, functions, methods, examples, or any grouped items under a heading or topic:
1. FIRST, create an overview flashcard where the "term" is the group heading (e.g., "Advantages of Solar Energy", "Steps of Mitosis", "Types of Bonds") and the "definition" is a numbered list of ONLY the item names, like:
   "1. Cost efficiency  2. Environmental impact  3. Scalability"
2. THEN, create a SEPARATE flashcard for EACH individual item, where the "term" is the item name with context (e.g., "Cost efficiency (advantage of Solar Energy)") and the "definition" explains that specific item in detail.

Example for enumerations:
Given text: "Advantages of X: Speed - it processes data quickly, Cost - it reduces expenses, Reliability - it maintains uptime"
Output:
  { "term": "Advantages of X", "definition": "1. Speed\n  2. Cost\n  3. Reliability" }
  { "term": "Speed (advantage of X)", "definition": "It processes data quickly." }
  { "term": "Cost (advantage of X)", "definition": "It reduces expenses." }
  { "term": "Reliability (advantage of X)", "definition": "It maintains uptime." }

Apply this pattern to ALL enumerations found in the text — steps, phases, types, pros/cons, subtopics, categories, etc.

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
