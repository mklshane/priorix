// app/api/user-deck-activity/record/route.ts
import { NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import { recordDeckAccess } from "@/lib/models/UserDeckActivity";
import mongoose from "mongoose";

export async function POST(req: Request) {
  await ConnectDB();

  try {
    const { deckId, userId } = await req.json();

    if (!deckId || !userId) {
      return NextResponse.json(
        {
          error: "Deck ID and User ID are required",
        },
        { status: 400 }
      );
    }

    // Record the deck access
    await recordDeckAccess(
      new mongoose.Types.ObjectId(userId),
      new mongoose.Types.ObjectId(deckId)
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Error recording deck access:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
