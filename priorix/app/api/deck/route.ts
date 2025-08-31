import { NextRequest, NextResponse } from "next/server";
import * as deckController from "./controller";


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deckId = searchParams.get("id") || undefined;
    const userId = searchParams.get("userId") || undefined;

    const result = await deckController.getDecks({ deckId, userId });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await deckController.createDeck(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await deckController.updateDeck(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deckId = searchParams.get("id");
    if (!deckId)
      return NextResponse.json({ error: "Deck ID required" }, { status: 400 });

    const result = await deckController.deleteDeck(deckId);
    return NextResponse.json({
      message: "Deck deleted successfully",
      deck: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
