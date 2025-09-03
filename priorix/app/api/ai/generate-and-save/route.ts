import { NextResponse } from "next/server";
import Deck from "@/lib/models/Deck";
import Flashcard from "@/lib/models/Flashcard";
import { ConnectDB } from "@/lib/config/db";
import { generateFlashcardsFromText } from "@/lib/gemini";
import { IFlashcard } from "@/types/flashcard"; 

export async function POST(req: Request) {
  try {
    const { text, deckId } = await req.json();

    if (!text || !deckId) {
      return NextResponse.json(
        { error: "Missing text or deckId" },
        { status: 400 }
      );
    }

    await ConnectDB();

    const flashcards: IFlashcard[] = await generateFlashcardsFromText(
      text,
      deckId
    );

    // Save flashcards to DB
    const saved = await Flashcard.insertMany(
      flashcards.map((f: IFlashcard) => ({
        deck: deckId,
        term: f.term,
        definition: f.definition,
      }))
    );

    // Update deck with flashcards
    await Deck.findByIdAndUpdate(deckId, {
      $push: { flashcards: { $each: saved.map((f) => f._id) } },
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
