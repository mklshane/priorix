import { NextResponse } from "next/server";
import Deck from "@/lib/models/Deck";
import { ConnectDB } from "@/lib/config/db";
import UserDeckActivity from "@/lib/models/UserDeckActivity";


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

    // Optional: log user activity if userId is provided
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
    const deleted = await Deck.findByIdAndDelete(deckId);
    if (!deleted)
      return NextResponse.json({ message: "Deck not found" }, { status: 404 });
    return NextResponse.json({
      message: "Deck deleted successfully",
      deck: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error deleting deck", error },
      { status: 500 }
    );
  }
}
