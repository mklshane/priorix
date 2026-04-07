import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import Deck from "@/lib/models/Deck";
import UserLearningProfile from "@/lib/models/UserLearningProfile";
import User from "@/lib/models/User";
import { verifyCronSecret } from "@/lib/notifications/verifyCronSecret";
import { getDateKey } from "@/lib/notifications/getDateKey";
import { wasAlreadySent, logNotification } from "@/lib/notifications/checkAndLog";
import { sendDeckStudyPeriodEndingEmail } from "@/lib/config/mail";
import { getSiteUrl } from "@/lib/site-url";

const MAX_DECKS_PER_RUN = 50;
const WINDOW_MS = 12 * 60 * 60 * 1000; // ±12 hours around target day

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ConnectDB();

  const dateKey = getDateKey();
  const now = new Date();
  const siteUrl = getSiteUrl();

  // Build windows for 1-day and 3-day targets
  const targets = [1, 3].map((days) => {
    const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return {
      daysLeft: days,
      from: new Date(target.getTime() - WINDOW_MS),
      to: new Date(target.getTime() + WINDOW_MS),
    };
  });

  const orConditions = targets.map((t) => ({
    studyPeriodEnd: { $gte: t.from, $lte: t.to },
  }));

  const decks = await Deck.find({
    $or: orConditions,
    studyPeriodEnd: { $exists: true },
  })
    .select("title studyPeriodEnd user")
    .limit(MAX_DECKS_PER_RUN)
    .lean();

  if (decks.length === MAX_DECKS_PER_RUN) {
    console.warn("[cron/deck-study-period-ending] Hit deck limit — some decks may be skipped.");
  }

  let sent = 0;
  let skipped = 0;

  for (const deck of decks) {
    const userId = deck.user.toString();
    const deckId = deck._id.toString();

    const profile = await UserLearningProfile.findOne({ userId })
      .select("enableSmartNotifications notificationPreferences")
      .lean();

    if (!profile?.enableSmartNotifications) {
      skipped++;
      continue;
    }

    if (profile.notificationPreferences?.deckStudyPeriodEnding === false) {
      skipped++;
      continue;
    }

    if (await wasAlreadySent(userId, "deck_study_period_ending", deckId, dateKey)) {
      skipped++;
      continue;
    }

    // Calculate daysLeft from the matching target window
    const msUntilEnd = deck.studyPeriodEnd!.getTime() - now.getTime();
    const daysLeft = msUntilEnd < 2 * 24 * 60 * 60 * 1000 ? 1 : 3;

    const user = await User.findById(userId).select("email name").lean();
    if (!user?.email) {
      skipped++;
      continue;
    }

    try {
      await sendDeckStudyPeriodEndingEmail(
        user.email,
        user.name,
        deck.title,
        deck.studyPeriodEnd!,
        daysLeft,
        `${siteUrl}/decks/${deckId}`
      );
      await logNotification(userId, "deck_study_period_ending", deckId, dateKey, {
        deckTitle: deck.title,
        studyPeriodEnd: deck.studyPeriodEnd,
        daysLeft,
      });
      sent++;
    } catch (err) {
      console.error(`[cron/deck-study-period-ending] Failed to send for deck ${deckId}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
