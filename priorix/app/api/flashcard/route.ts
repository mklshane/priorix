import { NextRequest, NextResponse } from "next/server";
import * as flashcardController from "./controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deckId = searchParams.get("deckId");
    if (!deckId)
      return NextResponse.json(
        { error: "deckId is required" },
        { status: 400 }
      );

    const userId = searchParams.get("userId") || undefined;
    const flashcards = await flashcardController.getFlashcards(deckId, userId);
    return NextResponse.json(flashcards);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const flashcard = await flashcardController.createFlashcard(body);
    return NextResponse.json(flashcard, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await flashcardController.updateFlashcard(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    const deleted = await flashcardController.deleteFlashcard(id);
    return NextResponse.json({
      message: "Flashcard deleted",
      flashcard: deleted,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
