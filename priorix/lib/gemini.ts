import { GoogleGenerativeAI } from "@google/generative-ai";
import { IFlashcard } from "@/types/flashcard";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateFlashcardsFromText(
  text: string,
  deckId: string
): Promise<IFlashcard[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a flashcard generator. Carefully read the following text and extract ALL key terms, names, people, events, concepts, objects, and important ideas.  

Rules for generating flashcards:
- Return ONLY a JSON array in this exact format:
[
  {
    "term": "term here",
    "definition": "definition here",
    "deck": "${deckId}"
  }
]
- Include ALL terms and key ideas found in the text. Do not omit any.
- Use the EXACT wording from the material for each definition. Do not rephrase or summarize.
- If a term has multiple definitions or explanations, create MULTIPLE flashcards for that term, one per definition.
- Ensure every flashcard has a clear "term" and "definition".
- DO NOT create duplicate flashcards. Each flashcard must be unique.
- For terms with multiple definitions, ensure each definition is distinct and not repetitive.

Text to analyze:
${text.substring(0, 30000)}
`;

    const result = await model.generateContent(prompt);
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
