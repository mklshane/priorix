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
  // Adaptive learning fields
  perceivedDifficulty: number; // 1-10 scale
  retentionRate: number; // 0-100
  forgettingCurveSlope: number;
  confidenceLevel: number; // 1-5
  optimalInterval: number; // calculated optimal interval in days
  forgetProbability: number; // 0-1
  priorityScore: number; // calculated priority for review
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
    // Adaptive learning fields
    perceivedDifficulty: { type: Number, default: 5, min: 1, max: 10 },
    retentionRate: { type: Number, default: 0, min: 0, max: 100 },
    forgettingCurveSlope: { type: Number, default: 0 },
    confidenceLevel: { type: Number, default: 3, min: 1, max: 5 },
    optimalInterval: { type: Number, default: 0 },
    forgetProbability: { type: Number, default: 0, min: 0, max: 1 },
    priorityScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserCardProgressSchema.index({ userId: 1, cardId: 1 }, { unique: true });

const UserCardProgress: Model<IUserCardProgress> =
  (mongoose.models.UserCardProgress as Model<IUserCardProgress>) ||
  mongoose.model<IUserCardProgress>("UserCardProgress", UserCardProgressSchema);

export default UserCardProgress;
