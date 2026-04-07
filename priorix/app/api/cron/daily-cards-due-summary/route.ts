import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { ConnectDB } from "@/lib/config/db";
import UserLearningProfile from "@/lib/models/UserLearningProfile";
import UserCardProgress from "@/lib/models/UserCardProgress";
import Deck from "@/lib/models/Deck";
import User from "@/lib/models/User";
import { verifyCronSecret } from "@/lib/notifications/verifyCronSecret";
import { getDateKey } from "@/lib/notifications/getDateKey";
import { wasAlreadySent, logNotification } from "@/lib/notifications/checkAndLog";
import { sendDailyCardsDueSummaryEmail } from "@/lib/config/mail";
import { getSiteUrl } from "@/lib/site-url";

const MAX_USERS_PER_RUN = 50;

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ConnectDB();

  const dateKey = getDateKey();
  const now = new Date();
  const siteUrl = getSiteUrl();

  const profiles = await UserLearningProfile.find({
    enableSmartNotifications: true,
  })
    .select("userId notificationPreferences")
    .limit(MAX_USERS_PER_RUN)
    .lean();

  if (profiles.length === MAX_USERS_PER_RUN) {
    console.warn("[cron/daily-cards-due-summary] Hit user limit — some users may be skipped.");
  }

  let sent = 0;
  let skipped = 0;

  for (const profile of profiles) {
    if (profile.notificationPreferences?.dailyCardsDueSummary === false) {
      skipped++;
      continue;
    }

    const userId = profile.userId.toString();

    if (await wasAlreadySent(userId, "daily_cards_due_summary", null, dateKey)) {
      skipped++;
      continue;
    }

    // Aggregate cards due per deck for this user
    const dueCounts = await UserCardProgress.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          nextReviewAt: { $lte: now },
        },
      },
      {
        $group: {
          _id: "$deckId",
          dueCount: { $sum: 1 },
        },
      },
    ]);

    if (dueCounts.length === 0) {
      skipped++;
      continue;
    }

    const totalDue = dueCounts.reduce((sum, d) => sum + d.dueCount, 0);

    // Fetch deck titles
    const deckIds = dueCounts.map((d) => d._id);
    const decks = await Deck.find({ _id: { $in: deckIds } })
      .select("_id title")
      .lean();

    const deckTitleMap = new Map(decks.map((d) => [d._id.toString(), d.title]));

    const deckList = dueCounts
      .map((d) => ({
        title: deckTitleMap.get(d._id.toString()) ?? "Untitled Deck",
        dueCount: d.dueCount,
        deckId: d._id.toString(),
      }))
      .sort((a, b) => b.dueCount - a.dueCount);

    const user = await User.findById(userId).select("email name").lean();
    if (!user?.email) {
      skipped++;
      continue;
    }

    try {
      await sendDailyCardsDueSummaryEmail(
        user.email,
        user.name,
        deckList,
        totalDue,
        `${siteUrl}/dashboard`
      );
      await logNotification(userId, "daily_cards_due_summary", null, dateKey, {
        totalDue,
        deckCount: deckList.length,
      });
      sent++;
    } catch (err) {
      console.error(`[cron/daily-cards-due-summary] Failed to send to ${userId}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
