import { NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import Favorite from "@/lib/models/Favorites";
import mongoose from "mongoose";

// Ensure related models are registered before populate is used in cold starts
// on serverless (prevents MissingSchemaError in production).
import "@/lib/models/Deck";
import "@/lib/models/User";

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

export async function GET(req: Request) {
  await ConnectDB();

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const deckId = searchParams.get("deckId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (deckId) {
      const favorite = await Favorite.findOne({ userId, deckId });
      return NextResponse.json({ isFavorited: !!favorite }, { status: 200 });
    } else {
      const favorites = await Favorite.find({ userId })
        .populate({
          path: "deckId",
          populate: {
            path: "user", 
            select: "name email",
          },
        })
        .lean();

      const decks = favorites
        .filter((fav) => fav.deckId && typeof fav.deckId === "object") // guard
        .map((fav: any) => ({
          _id: fav.deckId._id,
          title: fav.deckId.title,
          description: fav.deckId.description,
          isPublic: fav.deckId.isPublic,
          flashcards: fav.deckId.flashcards,
          createdAt: fav.deckId.createdAt,
          updatedAt: fav.deckId.updatedAt,
          user: fav.deckId.user
            ? {
                _id: fav.deckId.user._id,
                name: fav.deckId.user.name,
                email: fav.deckId.user.email,
              }
            : null,
        }));

      return NextResponse.json(decks, { status: 200 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


