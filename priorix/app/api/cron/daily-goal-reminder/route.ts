import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import UserLearningProfile from "@/lib/models/UserLearningProfile";
import User from "@/lib/models/User";
import { verifyCronSecret } from "@/lib/notifications/verifyCronSecret";
import { getDateKey } from "@/lib/notifications/getDateKey";
import { getReviewedTodayCount } from "@/lib/notifications/getReviewedTodayCount";
import { wasAlreadySent, logNotification } from "@/lib/notifications/checkAndLog";
import { sendDailyReviewReminderEmail } from "@/lib/config/mail";
import { getSiteUrl } from "@/lib/site-url";

const MAX_USERS_PER_RUN = 50;

// Fires at 6pm PHT as a fallback for users who haven't hit their daily goal,
// regardless of whether they have preferredStudyTimes configured.
// Reuses the "daily_review_reminder" type so the idempotency check prevents
// double-sending to users who were already reminded at their preferred hour.
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ConnectDB();

  const dateKey = getDateKey();
  const siteUrl = getSiteUrl();

  const profiles = await UserLearningProfile.find({
    enableSmartNotifications: true,
  })
    .select("userId dailyReviewGoal notificationPreferences")
    .limit(MAX_USERS_PER_RUN)
    .lean();

  if (profiles.length === MAX_USERS_PER_RUN) {
    console.warn("[cron/daily-goal-reminder] Hit user limit — some users may be skipped.");
  }

  let sent = 0;
  let skipped = 0;

  for (const profile of profiles) {
    if (profile.notificationPreferences?.dailyReviewReminder === false) {
      skipped++;
      continue;
    }

    const userId = profile.userId.toString();

    // Skip if they already received a daily review reminder today
    // (e.g. from the preferred-time hourly cron)
    if (await wasAlreadySent(userId, "daily_review_reminder", null, dateKey)) {
      skipped++;
      continue;
    }

    const reviewedCount = await getReviewedTodayCount(userId);

    if (reviewedCount >= profile.dailyReviewGoal) {
      skipped++;
      continue;
    }

    const user = await User.findById(userId).select("email name").lean();
    if (!user?.email) {
      skipped++;
      continue;
    }

    try {
      await sendDailyReviewReminderEmail(
        user.email,
        user.name,
        reviewedCount,
        profile.dailyReviewGoal,
        `${siteUrl}/dashboard`
      );
      await logNotification(userId, "daily_review_reminder", null, dateKey, {
        reviewedCount,
        goal: profile.dailyReviewGoal,
        source: "daily-goal-fallback",
      });
      sent++;
    } catch (err) {
      console.error(`[cron/daily-goal-reminder] Failed to send to ${userId}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
