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

      Text to analyze:
      ${text.substring(0, 30000)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // Extract JSON from the response
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No valid JSON array found in Gemini response");
    }

    const rawFlashcards = JSON.parse(jsonMatch[0]) as {
      term: string;
      definition: string;
      deck: string;
    }[];

    // Map into IFlashcard[] with metadata
    const flashcards: IFlashcard[] = rawFlashcards.map((flashcard, index) => ({
      ...flashcard,
      _id: `gemini-${Date.now()}-${index}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return flashcards;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate flashcards from text");
  }
}
