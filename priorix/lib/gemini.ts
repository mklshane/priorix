// lib/gemini.ts - Optimized for speed
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
You are a flashcard generator. Create flashcards from the text.

Return ONLY JSON array in this format:
[
  {"term": "term here", "definition": "definition here", "deck": "${deckId}"}
]

Text to analyze:
${text.substring(0, 30000)}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // Fast JSON extraction
    const jsonStart = textResponse.indexOf("[");
    const jsonEnd = textResponse.lastIndexOf("]") + 1;

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("No JSON array found");
    }

    const jsonString = textResponse.slice(jsonStart, jsonEnd);
    const rawFlashcards = JSON.parse(jsonString);

    // Fast mapping without additional validation
    const timestamp = Date.now();
    const flashcards: IFlashcard[] = rawFlashcards.map(
      (flashcard: any, index: number) => ({
        term: flashcard.term,
        definition: flashcard.definition,
        deck: flashcard.deck || deckId, // Fallback to ensure deck ID
        _id: `gemini-${timestamp}-${index}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    return flashcards;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate flashcards");
  }
}
