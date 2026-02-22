import { NextResponse } from "next/server";
import Deck from "@/lib/models/Deck";
import Flashcard from "@/lib/models/Flashcard";
import { ConnectDB } from "@/lib/config/db";
import { generateFlashcardsFromText } from "@/lib/gemini";
import { assessCardDifficultyBatch } from "@/lib/ai-difficulty";
import { IFlashcard } from "@/types/flashcard"; 

export async function POST(req: Request) {
  try {
    const { text, deckId } = await req.json();
    const normalizedText = typeof text === "string" ? text.trim() : "";

    if (!normalizedText || !deckId) {
      return NextResponse.json(
        { error: "Missing text or deckId" },
        { status: 400 }
      );
    }

    await ConnectDB();

    const deck = await Deck.findById(deckId).select("sourceText").lean<{
      sourceText?: string;
    }>();

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const flashcards: IFlashcard[] = await generateFlashcardsFromText(normalizedText, deckId);

    // Assess difficulty for all generated cards
    const cardsWithDifficulty = await assessCardDifficultyBatch(
      flashcards.map((f) => ({ term: f.term, definition: f.definition }))
    );

    // Save flashcards to DB with difficulty scores
    const saved = await Flashcard.insertMany(
      cardsWithDifficulty.map((difficultyScore, index) => ({
        deck: deckId,
        term: flashcards[index].term,
        definition: flashcards[index].definition,
        estimatedDifficulty: difficultyScore,
      }))
    );

    // Update deck with flashcards and append source text (if not already present)
    const existingSourceText = (deck.sourceText || "").trim();
    const hasTextAlready =
      existingSourceText.length > 0 && existingSourceText.includes(normalizedText);

    const updatedSourceText = hasTextAlready
      ? existingSourceText
      : existingSourceText.length > 0
      ? `${existingSourceText}\n\n${normalizedText}`
      : normalizedText;

    await Deck.findByIdAndUpdate(deckId, {
      $push: { flashcards: { $each: saved.map((f) => f._id) } },
      $set: {
        sourceText: updatedSourceText,
        sourceTextUpdatedAt: new Date(),
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
