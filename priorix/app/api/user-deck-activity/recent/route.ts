// app/api/user-deck-activity/recent/route.ts
import { NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import UserDeckActivity from "@/lib/models/UserDeckActivity";
import mongoose from "mongoose";

export async function GET(req: Request) {
  await ConnectDB();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const limit = Number(searchParams.get("limit")) || 10;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Use aggregation for reliable results
    const recentActivities = await UserDeckActivity.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { lastAccessedAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "decks", // The actual collection name in MongoDB
          localField: "deckId",
          foreignField: "_id",
          as: "deck",
        },
      },
      { $unwind: "$deck" },
      {
        $project: {
          _id: "$deck._id",
          title: "$deck.title",
          description: "$deck.description",
          isPublic: "$deck.isPublic",
          userId: "$deck.userId",
          flashcards: "$deck.flashcards",
          createdAt: "$deck.createdAt",
          updatedAt: "$deck.updatedAt",
          lastStudied: {
            $dateToString: { format: "%Y-%m-%d", date: "$lastAccessedAt" },
          },
        },
      },
    ]);

    return NextResponse.json(recentActivities, { status: 200 });
  } catch (err: any) {
    console.error("Error in recent decks API:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
