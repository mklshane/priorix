import { NextResponse } from "next/server";
import Deck from "@/lib/models/Deck";
import { ConnectDB } from "@/lib/config/db";
import UserDeckActivity from "@/lib/models/UserDeckActivity";
import { Flashcard } from "@/lib/models";
import mongoose from "mongoose";


export async function GET(
  req: Request,
  { params }: { params: { deckId: string } }
) {
  await ConnectDB();
  const { deckId } = params;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;

    const deck = await Deck.findById(deckId).populate("flashcards");
    if (!deck) {
      return NextResponse.json({ message: "Deck not found" }, { status: 404 });
    }

    if (userId) {
      await UserDeckActivity.findOneAndUpdate(
        { userId, deckId },
        { lastAccessedAt: new Date() },
        { upsert: true }
      );
    }

    return NextResponse.json(deck);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching deck", error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { deckId: string } }
) {
  await ConnectDB();
  const { deckId } = params;

  try {
    const deck = await Deck.findById(deckId);
    if (!deck) {
      return NextResponse.json({ message: "Deck not found" }, { status: 404 });
    }

    const result = await Flashcard.deleteMany({
      deck: new mongoose.Types.ObjectId(deckId),
    });
    console.log("Deleted flashcards:", result.deletedCount);

    
    const deleted = await Deck.findByIdAndDelete(deckId).populate(
      "user",
      "name"
    );

    return NextResponse.json({
      message: "Deck and its flashcards deleted successfully",
      deck: deleted,
      deletedFlashcards: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error deleting deck", error },
      { status: 500 }
    );
  }
}
