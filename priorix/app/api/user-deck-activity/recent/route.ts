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

    const recentActivities = await UserDeckActivity.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { lastAccessedAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "decks", 
          localField: "deckId",
          foreignField: "_id",
          as: "deck",
        },
      },
      { $unwind: "$deck" },
      {
        $lookup: {
          from: "users",
          localField: "deck.user", 
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } }, 
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
          user: {
            _id: "$userData._id",
            name: "$userData.name",
            email: "$userData.email",
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
