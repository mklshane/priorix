import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import Task from "@/lib/models/Task";
import UserLearningProfile from "@/lib/models/UserLearningProfile";
import User from "@/lib/models/User";
import { verifyCronSecret } from "@/lib/notifications/verifyCronSecret";
import { getDateKey } from "@/lib/notifications/getDateKey";
import { wasAlreadySent, logNotification } from "@/lib/notifications/checkAndLog";
import { sendTaskDueSoonEmail } from "@/lib/config/mail";
import { getSiteUrl } from "@/lib/site-url";

const MAX_TASKS_PER_RUN = 50;

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ConnectDB();

  const dateKey = getDateKey();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const siteUrl = getSiteUrl();

  const tasks = await Task.find({
    dueDate: { $gte: now, $lte: in24h },
    status: { $ne: "completed" },
  })
    .select("taskTitle dueDate createdBy")
    .limit(MAX_TASKS_PER_RUN)
    .lean();

  if (tasks.length === MAX_TASKS_PER_RUN) {
    console.warn("[cron/task-due-soon] Hit task limit — some tasks may be skipped this run.");
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

    if (profile.notificationPreferences?.taskDueSoon === false) {
      skipped++;
      continue;
    }

    if (await wasAlreadySent(userId, "task_due_soon", taskId, dateKey)) {
      skipped++;
      continue;
    }

    const user = await User.findById(userId).select("email name").lean();
    if (!user?.email) {
      skipped++;
      continue;
    }

    try {
      await sendTaskDueSoonEmail(
        user.email,
        user.name,
        task.taskTitle,
        task.dueDate,
        `${siteUrl}/todo`
      );
      await logNotification(userId, "task_due_soon", taskId, dateKey, {
        taskTitle: task.taskTitle,
        dueDate: task.dueDate,
      });
      sent++;
    } catch (err) {
      console.error(`[cron/task-due-soon] Failed to send for task ${taskId}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
