import NotificationLog, { NotificationType } from "@/lib/models/NotificationLog";

/**
 * Returns true if this notification was already sent for the given day.
 * entityId should be the string form of a MongoDB ObjectId, or null for non-entity notifications.
 */
export async function wasAlreadySent(
  userId: string,
  type: NotificationType,
  entityId: string | null,
  dateKey: string
): Promise<boolean> {
  const existing = await NotificationLog.findOne({
    userId,
    type,
    entityId: entityId ?? null,
    dateKey,
  }).lean();
  return !!existing;
}

/**
 * Records a sent notification to prevent duplicate sends within the same day.
 * Call this only after a successful email send.
 */
export async function logNotification(
  userId: string,
  type: NotificationType,
  entityId: string | null,
  dateKey: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await NotificationLog.create({
    userId,
    type,
    entityId: entityId ?? null,
    dateKey,
    sentAt: new Date(),
    metadata,
  });
}
