import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import Task from "@/lib/models/Task";
import UserLearningProfile from "@/lib/models/UserLearningProfile";
import User from "@/lib/models/User";
import { verifyCronSecret } from "@/lib/notifications/verifyCronSecret";
import { getDateKey, getStartOfTodayUTC } from "@/lib/notifications/getDateKey";
import { wasAlreadySent, logNotification } from "@/lib/notifications/checkAndLog";
import { sendTaskOverdueEmail } from "@/lib/config/mail";
import { getSiteUrl } from "@/lib/site-url";

const MAX_TASKS_PER_RUN = 50;

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ConnectDB();

  const dateKey = getDateKey();
  const startOfToday = getStartOfTodayUTC();
  const siteUrl = getSiteUrl();

  const tasks = await Task.find({
    dueDate: { $lt: startOfToday },
    status: { $ne: "completed" },
  })
    .select("taskTitle dueDate createdBy")
    .limit(MAX_TASKS_PER_RUN)
    .lean();

  if (tasks.length === MAX_TASKS_PER_RUN) {
    console.warn("[cron/task-overdue] Hit task limit — some tasks may be skipped this run.");
  }

  let sent = 0;
  let skipped = 0;

  for (const task of tasks) {
    const userId = task.createdBy.toString();
    const taskId = task._id.toString();

    const profile = await UserLearningProfile.findOne({ userId })
      .select("enableSmartNotifications notificationPreferences")
      .lean();

    if (!profile?.enableSmartNotifications) {
      skipped++;
      continue;
    }

    if (profile.notificationPreferences?.taskOverdue === false) {
      skipped++;
      continue;
    }

    // Use today's dateKey so we only send once per overdue task per day
    if (await wasAlreadySent(userId, "task_overdue", taskId, dateKey)) {
      skipped++;
      continue;
    }

    const user = await User.findById(userId).select("email name").lean();
    if (!user?.email) {
      skipped++;
      continue;
    }

    try {
      await sendTaskOverdueEmail(
        user.email,
        user.name,
        task.taskTitle,
        task.dueDate,
        `${siteUrl}/todo`
      );
      await logNotification(userId, "task_overdue", taskId, dateKey, {
        taskTitle: task.taskTitle,
        dueDate: task.dueDate,
      });
      sent++;
    } catch (err) {
      console.error(`[cron/task-overdue] Failed to send for task ${taskId}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
