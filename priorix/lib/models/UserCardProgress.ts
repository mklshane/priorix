import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserCardProgress extends Document {
  userId: mongoose.Types.ObjectId;
  cardId: mongoose.Types.ObjectId;
  deckId: mongoose.Types.ObjectId;
  easeFactor: number;
  intervalDays: number;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  reviewCount: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  averageResponseTime: number;
  currentState: "new" | "learning" | "review" | "relearning";
  learningStepIndex: number;
  lapseCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserCardProgressSchema: Schema<IUserCardProgress> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cardId: { type: Schema.Types.ObjectId, ref: "Flashcard", required: true },
    deckId: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
    easeFactor: { type: Number, default: 2.5 },
    intervalDays: { type: Number, default: 0 },
    lastReviewedAt: { type: Date, default: null },
    nextReviewAt: { type: Date, default: null },
    reviewCount: { type: Number, default: 0 },
    againCount: { type: Number, default: 0 },
    hardCount: { type: Number, default: 0 },
    goodCount: { type: Number, default: 0 },
    easyCount: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    currentState: {
      type: String,
      enum: ["new", "learning", "review", "relearning"],
      default: "new",
    },
    learningStepIndex: { type: Number, default: 0 },
    lapseCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserCardProgressSchema.index({ userId: 1, cardId: 1 }, { unique: true });

const UserCardProgress: Model<IUserCardProgress> =
  (mongoose.models.UserCardProgress as Model<IUserCardProgress>) ||
  mongoose.model<IUserCardProgress>("UserCardProgress", UserCardProgressSchema);

export default UserCardProgress;
