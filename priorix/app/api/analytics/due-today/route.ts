import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import UserCardProgress from "@/lib/models/UserCardProgress";
import Deck from "@/lib/models/Deck";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await ConnectDB();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch all user card progress
    const allProgress = await UserCardProgress.find({ userId });

    // Separate due cards and at-risk cards
    const dueProgress = allProgress.filter((p) => {
      if (!p.nextReviewAt) return true; // new cards are always due
      return new Date(p.nextReviewAt).getTime() <= now.getTime();
    });

    const atRiskProgress = allProgress.filter((p) => {
      if (!p.nextReviewAt) return false; // new cards aren't at-risk yet
      const notYetDue = new Date(p.nextReviewAt).getTime() > now.getTime();
      return notYetDue && (p.forgetProbability ?? 0) > 0.65;
    });

    const isValidId = (id: any) =>
      id != null && /^[a-f\d]{24}$/i.test(String(id));

    // Group due cards by deckId
    const deckDueMap = new Map<
      string,
      { dueCount: number; newCount: number; overdueCount: number }
    >();

    for (const p of dueProgress) {
      if (!isValidId(p.deckId)) continue;
      const deckId = String(p.deckId);
      if (!deckDueMap.has(deckId)) {
        deckDueMap.set(deckId, { dueCount: 0, newCount: 0, overdueCount: 0 });
      }
      const entry = deckDueMap.get(deckId)!;
      entry.dueCount++;

      if (!p.nextReviewAt) {
        entry.newCount++;
      } else if (new Date(p.nextReviewAt).getTime() < oneDayAgo.getTime()) {
        entry.overdueCount++;
      }
    }

    // Group at-risk cards by deckId
    const deckAtRiskMap = new Map<string, number>();
    for (const p of atRiskProgress) {
      if (!isValidId(p.deckId)) continue;
      const deckId = String(p.deckId);
      deckAtRiskMap.set(deckId, (deckAtRiskMap.get(deckId) ?? 0) + 1);
    }

    // Fetch deck titles for relevant decks
    // Filter out any falsy/empty deckIds before querying
    const allDeckIds = Array.from(
      new Set([...deckDueMap.keys(), ...deckAtRiskMap.keys()])
    ).filter(Boolean);

    const decks = await Deck.find({ _id: { $in: allDeckIds } })
      .select("_id title")
      .lean();

    const deckTitleMap = new Map<string, string>(
      decks.map((d: any) => [String(d._id), d.title as string])
    );

    // Build per-deck result with urgency score
    const deckResults = Array.from(deckDueMap.entries()).map(
      ([deckId, counts]) => {
        const urgencyScore =
          counts.overdueCount * 3 + counts.dueCount * 1 + counts.newCount * 0.5;
        return {
          deckId,
          title: deckTitleMap.get(deckId) ?? "Unknown Deck",
          dueCount: counts.dueCount,
          newCount: counts.newCount,
          overdueCount: counts.overdueCount,
          urgencyScore: Math.round(urgencyScore),
        };
      }
    );

    // Sort by urgency score descending
    deckResults.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // Build at-risk deck results
    const atRiskDecks = Array.from(deckAtRiskMap.entries()).map(
      ([deckId, count]) => ({
        deckId,
        title: deckTitleMap.get(deckId) ?? "Unknown Deck",
        atRiskCount: count,
      })
    );
    atRiskDecks.sort((a, b) => b.atRiskCount - a.atRiskCount);

    return NextResponse.json({
      totalDue: dueProgress.length,
      totalAtRisk: atRiskProgress.length,
      decks: deckResults,
      atRiskDecks,
    });
  } catch (err: any) {
    console.error("GET /api/analytics/due-today error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
