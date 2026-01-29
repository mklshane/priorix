import { NextRequest, NextResponse } from "next/server";
import { srsRatings } from "@/lib/srs-config";
import { getDueFlashcards, reviewFlashcard } from "./controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deckId = searchParams.get("deckId");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (!deckId) {
      return NextResponse.json({ error: "deckId is required" }, { status: 400 });
    }

    const cards = await getDueFlashcards(deckId, Number.isNaN(limit) ? 10 : limit);
    return NextResponse.json(cards);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardId, rating, responseTimeMs } = body || {};
    if (!cardId || !rating) {
      return NextResponse.json(
        { error: "cardId and rating are required" },
        { status: 400 }
      );
    }
    if (!srsRatings.includes(rating)) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const updated = await reviewFlashcard({ cardId, rating, responseTimeMs });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
