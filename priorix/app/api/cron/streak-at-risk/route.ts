import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import UserLearningProfile from "@/lib/models/UserLearningProfile";
import User from "@/lib/models/User";
import { verifyCronSecret } from "@/lib/notifications/verifyCronSecret";
import { getDateKey, getStartOfTodayUTC } from "@/lib/notifications/getDateKey";
import { wasAlreadySent, logNotification } from "@/lib/notifications/checkAndLog";
import { sendStreakAtRiskEmail } from "@/lib/config/mail";
import { getSiteUrl } from "@/lib/site-url";

const MAX_USERS_PER_RUN = 50;

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ConnectDB();

  const dateKey = getDateKey();
  const startOfToday = getStartOfTodayUTC();
  const siteUrl = getSiteUrl();

  const profiles = await UserLearningProfile.find({
    enableSmartNotifications: true,
    currentStreak: { $gte: 3 },
    $or: [
      { lastStudyDate: { $lt: startOfToday } },
      { lastStudyDate: null },
    ],
  })
    .select("userId currentStreak notificationPreferences")
    .limit(MAX_USERS_PER_RUN)
    .lean();

  if (profiles.length === MAX_USERS_PER_RUN) {
    console.warn("[cron/streak-at-risk] Hit user limit — some users may be skipped this run.");
  }

  let sent = 0;
  let skipped = 0;

  for (const profile of profiles) {
    if (profile.notificationPreferences?.streakAtRisk === false) {
      skipped++;
      continue;
    }

    const userId = profile.userId.toString();

    if (await wasAlreadySent(userId, "streak_at_risk", null, dateKey)) {
      skipped++;
      continue;
    }

    const user = await User.findById(userId).select("email name").lean();
    if (!user?.email) {
      skipped++;
      continue;
    }

    try {
      await sendStreakAtRiskEmail(
        user.email,
        user.name,
        profile.currentStreak,
        `${siteUrl}/dashboard`
      );
      await logNotification(userId, "streak_at_risk", null, dateKey, {
        currentStreak: profile.currentStreak,
      });
      sent++;
    } catch (err) {
      console.error(`[cron/streak-at-risk] Failed to send to ${userId}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
