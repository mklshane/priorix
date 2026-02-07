import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import UserStudySession from "@/lib/models/UserStudySession";
import UserCardProgress from "@/lib/models/UserCardProgress";
import Flashcard from "@/lib/models/Flashcard";
import Deck from "@/lib/models/Deck";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const deckId = searchParams.get("deckId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await ConnectDB();

    if (deckId) {
      // Get insights for specific deck
      const deck = await Deck.findById(deckId);
      if (!deck) {
        return NextResponse.json({ error: "Deck not found" }, { status: 404 });
      }

      const sessions = await UserStudySession.find({
        userId,
        deckId,
      }).sort({ sessionStart: -1 });

      const cardProgress = await UserCardProgress.find({
        userId,
        deckId,
      });

      const flashcards = await Flashcard.find({ deck: deckId });

      // Calculate mastery for each card
      const cardInsights = cardProgress.map((progress) => {
        const card = flashcards.find(
          (f: any) => f._id.toString() === progress.cardId.toString()
        );

        return {
          cardId: progress.cardId,
          term: card?.term || "Unknown",
          reviewCount: progress.reviewCount,
          retentionRate: progress.retentionRate,
          perceivedDifficulty: progress.perceivedDifficulty,
          currentState: progress.currentState,
          intervalDays: progress.intervalDays,
          lapseCount: progress.lapseCount,
          averageResponseTime: progress.averageResponseTime,
          easeFactor: progress.easeFactor,
        };
      });

      const averageRetention =
        cardProgress.length > 0
          ? cardProgress.reduce((sum, c) => sum + c.retentionRate, 0) /
            cardProgress.length
          : 0;

      const averageDifficulty =
        cardProgress.length > 0
          ? cardProgress.reduce((sum, c) => sum + c.perceivedDifficulty, 0) /
            cardProgress.length
          : 5;

      const totalStudyTime = sessions.reduce((sum, s) => {
        const duration =
          (new Date(s.sessionEnd).getTime() -
            new Date(s.sessionStart).getTime()) /
          60000;
        return sum + duration;
      }, 0);

      // Find trouble areas (cards with low retention or high difficulty)
      const troubleCards = cardInsights
        .filter(
          (c) =>
            c.retentionRate < 60 ||
            c.perceivedDifficulty > 7 ||
            c.lapseCount > 2
        )
        .sort((a, b) => a.retentionRate - b.retentionRate)
        .slice(0, 10);

      // Mastery distribution
      const masteryDistribution = {
        new: 0,
        learning: 0,
        relearning: 0,
        young: 0,
        mature: 0,
        mastered: 0,
      };

      cardProgress.forEach((card) => {
        if (card.currentState === "new") {
          masteryDistribution.new++;
        } else if (card.currentState === "learning") {
          masteryDistribution.learning++;
        } else if (card.currentState === "relearning") {
          masteryDistribution.relearning++;
        } else if (card.intervalDays < 14) {
          masteryDistribution.young++;
        } else if (
          card.intervalDays >= 14 &&
          card.reviewCount >= 4 &&
          card.easeFactor >= 2.2 &&
          card.lapseCount <= 3
        ) {
          masteryDistribution.mastered++;
        } else {
          masteryDistribution.mature++;
        }
      });

      return NextResponse.json({
        deckId,
        deckTitle: deck.title,
        totalCards: flashcards.length,
        cardsStarted: cardProgress.length,
        averageRetention: Math.round(averageRetention),
        averageDifficulty: Math.round(averageDifficulty * 10) / 10,
        totalStudyTime: Math.round(totalStudyTime),
        sessionsCompleted: sessions.length,
        masteryDistribution,
        troubleCards,
        cardInsights: cardInsights
          .sort((a, b) => b.reviewCount - a.reviewCount)
          .slice(0, 20),
      });
    } else {
      // Get overview of all decks
      const sessions = await UserStudySession.find({ userId });
      const cardProgress = await UserCardProgress.find({ userId });

      // Group by deck
      const deckMap = new Map();

      for (const progress of cardProgress) {
        const deckId = progress.deckId.toString();
        if (!deckMap.has(deckId)) {
          deckMap.set(deckId, {
            cards: [],
            sessions: [],
          });
        }
        deckMap.get(deckId).cards.push(progress);
      }

      for (const session of sessions) {
        const deckId = session.deckId.toString();
        if (deckMap.has(deckId)) {
          deckMap.get(deckId).sessions.push(session);
        }
      }

      // Calculate metrics for each deck
      const deckInsights = [];
      for (const [deckId, data] of deckMap.entries()) {
        const deck = await Deck.findById(deckId);
        if (!deck) continue;

        const avgRetention =
          data.cards.length > 0
            ? data.cards.reduce((sum: number, c: any) => sum + c.retentionRate, 0) /
              data.cards.length
            : 0;

        const avgDifficulty =
          data.cards.length > 0
            ? data.cards.reduce(
                (sum: number, c: any) => sum + c.perceivedDifficulty,
                0
              ) / data.cards.length
            : 5;

        const mastered = data.cards.filter(
          (c: any) =>
            c.intervalDays >= 21 &&
            c.reviewCount >= 5 &&
            c.easeFactor >= 2.3 &&
            c.lapseCount <= 2
        ).length;

        deckInsights.push({
          deckId,
          deckTitle: deck.title,
          totalCards: data.cards.length,
          averageRetention: Math.round(avgRetention),
          averageDifficulty: Math.round(avgDifficulty * 10) / 10,
          cardsMastered: mastered,
          sessionsCompleted: data.sessions.length,
        });
      }

      return NextResponse.json({
        decks: deckInsights.sort(
          (a, b) => b.sessionsCompleted - a.sessionsCompleted
        ),
      });
    }
  } catch (error: any) {
    console.error("Error fetching deck insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch deck insights", details: error.message },
      { status: 500 }
    );
  }
}
