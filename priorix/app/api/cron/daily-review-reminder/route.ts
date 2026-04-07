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

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ConnectDB();

  const dateKey = getDateKey();
  // preferredStudyTimes is stored in PHT (UTC+8)
  const currentHour = (new Date().getUTCHours() + 8) % 24;
  const siteUrl = getSiteUrl();

  // Find users whose preferred study time matches the current UTC hour
  const profiles = await UserLearningProfile.find({
    enableSmartNotifications: true,
    preferredStudyTimes: currentHour,
  })
    .select("userId dailyReviewGoal notificationPreferences")
    .limit(MAX_USERS_PER_RUN)
    .lean();

  if (profiles.length === MAX_USERS_PER_RUN) {
    console.warn("[cron/daily-review-reminder] Hit user limit — some users may be skipped.");
  }

  let sent = 0;
  let skipped = 0;

  for (const profile of profiles) {
    if (profile.notificationPreferences?.dailyReviewReminder === false) {
      skipped++;
      continue;
    }

    const userId = profile.userId.toString();

    // Don't send if this user already received a daily review reminder today
    if (await wasAlreadySent(userId, "daily_review_reminder", null, dateKey)) {
      skipped++;
      continue;
    }

    const reviewedCount = await getReviewedTodayCount(userId);

    // Skip if they've already hit their goal
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
      });
      sent++;
    } catch (err) {
      console.error(`[cron/daily-review-reminder] Failed to send to ${userId}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
