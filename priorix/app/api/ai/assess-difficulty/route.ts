import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import Flashcard from "@/lib/models/Flashcard";
import { assessCardDifficulty, generateTopicTags } from "@/lib/ai-difficulty";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardId, term, definition } = body;

    if (!term || !definition) {
      return NextResponse.json(
        { error: "Term and definition required" },
        { status: 400 }
      );
    }

    await ConnectDB();

    // Assess difficulty
    const difficulty = await assessCardDifficulty(term, definition);
    
    // Generate topic tags
    const topicTags = await generateTopicTags(term, definition);

    // Update card if cardId provided
    if (cardId) {
      const card = await Flashcard.findById(cardId);
      if (!card) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
      }

      card.estimatedDifficulty = difficulty;
      card.topicTags = topicTags;
      await card.save();

      return NextResponse.json({
        success: true,
        cardId: card._id,
        difficulty,
        topicTags,
      });
    }

    // Return assessment only (for preview before saving)
    return NextResponse.json({
      success: true,
      difficulty,
      topicTags,
    });
  } catch (error: any) {
    console.error("Error assessing difficulty:", error);
    return NextResponse.json(
      { error: "Failed to assess difficulty", details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check if card needs difficulty assessment
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deckId = searchParams.get("deckId");

    if (!deckId) {
      return NextResponse.json(
        { error: "Deck ID required" },
        { status: 400 }
      );
    }

    await ConnectDB();

    // Find cards without difficulty assessment
    const cardsNeedingAssessment = await Flashcard.find({
      deck: deckId,
      $or: [
        { estimatedDifficulty: { $exists: false } },
        { estimatedDifficulty: null },
      ],
    }).limit(100);

    return NextResponse.json({
      count: cardsNeedingAssessment.length,
      cards: cardsNeedingAssessment.map((c) => ({
        id: c._id,
        term: c.term,
        definition: c.definition,
      })),
    });
  } catch (error: any) {
    console.error("Error checking cards:", error);
    return NextResponse.json(
      { error: "Failed to check cards", details: error.message },
      { status: 500 }
    );
  }
}
