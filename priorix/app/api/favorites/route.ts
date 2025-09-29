import { NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import Favorite from "@/lib/models/Favorites";
import mongoose from "mongoose";

export async function POST(req: Request) {
  await ConnectDB();

  try {
    const { userId, deckId } = await req.json();

    if (!userId || !deckId) {
      return NextResponse.json(
        { error: "userId and deckId are required" },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(deckId)
    ) {
      return NextResponse.json(
        { error: "Invalid userId or deckId" },
        { status: 400 }
      );
    }

    const favorite = await Favorite.findOneAndUpdate(
      { userId, deckId },
      { userId, deckId },
      { upsert: true, new: true }
    );

    return NextResponse.json(favorite, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await ConnectDB();

  try {
    const { userId, deckId } = await req.json();

    if (!userId || !deckId) {
      return NextResponse.json(
        { error: "userId and deckId are required" },
        { status: 400 }
      );
    }

    const deleted = await Favorite.findOneAndDelete({ userId, deckId });

    if (!deleted) {
      return NextResponse.json(
        { message: "Favorite not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Favorite removed" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
