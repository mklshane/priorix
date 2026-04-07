import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "daily_review_reminder"
  | "task_due_soon"
  | "task_overdue"
  | "deck_study_period_ending"
  | "daily_cards_due_summary"
  | "streak_at_risk";

export interface INotificationLog extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  entityId: mongoose.Types.ObjectId | null;
  sentAt: Date;
  dateKey: string; // YYYY-MM-DD UTC — idempotency scope
  metadata?: Record<string, unknown>;
}

const NotificationLogSchema = new Schema<INotificationLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      "daily_review_reminder",
      "task_due_soon",
      "task_overdue",
      "deck_study_period_ending",
      "daily_cards_due_summary",
      "streak_at_risk",
    ],
    required: true,
  },
  entityId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
  sentAt: {
    type: Date,
    default: () => new Date(),
  },
  dateKey: {
    type: String,
    required: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
});

// Idempotency index — one notification per user/type/entity/day
NotificationLogSchema.index(
  { userId: 1, type: 1, entityId: 1, dateKey: 1 },
  { unique: true }
);

// TTL — auto-expire logs after 90 days
NotificationLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const NotificationLog: Model<INotificationLog> =
  mongoose.models.NotificationLog ||
  mongoose.model<INotificationLog>("NotificationLog", NotificationLogSchema);

export default NotificationLog;
