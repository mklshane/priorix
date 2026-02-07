import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Assess the difficulty of a flashcard using AI
 * Returns a score from 1-10 where:
 * 1-3: Easy (simple facts, common terms)
 * 4-6: Medium (requires understanding, moderate complexity)
 * 7-10: Hard (complex concepts, requires deep understanding)
 */
export async function assessCardDifficulty(
  term: string,
  definition: string
): Promise<number> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
You are an educational difficulty assessor. Analyze the following flashcard and rate its difficulty from 1-10.

Consider these factors:
1. Vocabulary complexity (simple vs technical terms)
2. Concept abstractness (concrete vs abstract ideas)
3. Length and information density
4. Prerequisites needed (common knowledge vs specialized)
5. Memorization difficulty

Difficulty Scale:
- 1-2: Very simple (e.g., "What is water?" - "H2O")
- 3-4: Easy (basic terms and simple concepts)
- 5-6: Medium (requires understanding, moderate complexity)
- 7-8: Hard (complex concepts, technical terminology)
- 9-10: Very hard (highly abstract, multiple prerequisites, expert-level)

Flashcard:
Term: "${term}"
Definition: "${definition}"

Respond with ONLY a single number between 1 and 10. No explanation.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Extract number from response
    const match = text.match(/\d+/);
    if (!match) {
      console.warn("Could not parse difficulty score, defaulting to 5");
      return 5;
    }

    const difficulty = parseInt(match[0], 10);
    
    // Clamp to 1-10 range
    return Math.max(1, Math.min(10, difficulty));
  } catch (error) {
    console.error("Error assessing card difficulty:", error);
    // Default to medium difficulty on error
    return 5;
  }
}

/**
 * Assess difficulty for multiple flashcards in batch
 */
export async function assessCardDifficultyBatch(
  cards: Array<{ term: string; definition: string }>
): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Batch up to 10 cards per request
    const batchSize = 10;
    const results: number[] = [];

    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      
      const prompt = `
You are an educational difficulty assessor. Rate the difficulty of each flashcard from 1-10.

Consider: vocabulary complexity, concept abstractness, length, prerequisites needed, memorization difficulty.

Scale: 1-2 (very simple), 3-4 (easy), 5-6 (medium), 7-8 (hard), 9-10 (very hard).

Flashcards:
${batch.map((card, idx) => `${idx + 1}. Term: "${card.term}" - Definition: "${card.definition}"`).join("\n")}

Respond with ONLY the difficulty scores separated by commas (e.g., "5,7,3,6,4"). No other text.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Parse comma-separated scores
      const scores = text
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 10);

      // If parsing failed or wrong count, assign default
      if (scores.length !== batch.length) {
        console.warn("Batch difficulty assessment failed, using defaults");
        results.push(...Array(batch.length).fill(5));
      } else {
        results.push(...scores);
      }
    }

    return results;
  } catch (error) {
    console.error("Error in batch difficulty assessment:", error);
    // Return defaults on error
    return Array(cards.length).fill(5);
  }
}

/**
 * Generate topic tags for a flashcard
 */
export async function generateTopicTags(
  term: string,
  definition: string
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
Analyze this flashcard and generate 2-4 relevant topic tags.

Tags should be:
- Single words or short phrases (1-3 words)
- Academic categories or subject areas
- Lowercase
- No special characters

Examples: "biology", "world history", "chemistry", "mathematics", "programming", "physics", "literature"

Flashcard:
Term: "${term}"
Definition: "${definition}"

Respond with ONLY the tags separated by commas. No other text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parse comma-separated tags
    const tags = text
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0 && tag.length < 30)
      .slice(0, 4); // Max 4 tags

    return tags.length > 0 ? tags : ["general"];
  } catch (error) {
    console.error("Error generating topic tags:", error);
    return ["general"];
  }
}
