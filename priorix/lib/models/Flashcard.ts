import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFlashcard extends Document {
  term: string;
  definition: string;
  deck: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  /**
   * @deprecated SRS tracking moved to UserCardProgress. These fields on
   * Flashcard are kept for backward compatibility / migration seeding only.
   * The source of truth for all per-user SRS state is UserCardProgress.
   */
  easeFactor?: number;
  /** @deprecated Use UserCardProgress */
  intervalDays?: number;
  /** @deprecated Use UserCardProgress */
  lastReviewedAt?: Date | null;
  /** @deprecated Use UserCardProgress */
  nextReviewAt?: Date | null;
  /** @deprecated Use UserCardProgress */
  reviewCount?: number;
  /** @deprecated Use UserCardProgress */
  againCount?: number;
  /** @deprecated Use UserCardProgress */
  hardCount?: number;
  /** @deprecated Use UserCardProgress */
  goodCount?: number;
  /** @deprecated Use UserCardProgress */
  easyCount?: number;
  /** @deprecated Use UserCardProgress */
  averageResponseTime?: number;
  /** @deprecated Use UserCardProgress */
  currentState?: "new" | "learning" | "review" | "relearning";
  /** @deprecated Use UserCardProgress */
  learningStepIndex?: number;
  /** @deprecated Use UserCardProgress */
  lapseCount?: number;
  // Adaptive learning fields
  estimatedDifficulty?: number; // AI-predicted difficulty (1-10)
  actualDifficulty?: number; // User-aggregated difficulty (1-10)
  topicTags?: string[]; // Array of topic/category tags
  relatedCards?: mongoose.Types.ObjectId[]; // Related flashcard IDs
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema: Schema<IFlashcard> = new Schema(
  {
    term: { type: String, required: true, trim: true },
    definition: { type: String, required: true, trim: true },
    deck: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
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
    learningStepIndex: { type: Number, default: 0 },
    lapseCount: { type: Number, default: 0 },
    currentState: {
      type: String,
      enum: ["new", "learning", "review", "relearning"],
      default: "new",
    },
    // Adaptive learning fields
    estimatedDifficulty: { type: Number, default: 5, min: 1, max: 10 },
    actualDifficulty: { type: Number, default: null, min: 1, max: 10 },
    topicTags: { type: [String], default: [] },
    relatedCards: { type: [Schema.Types.ObjectId], ref: "Flashcard", default: [] },
  },
  { timestamps: true }
);

// Simple and direct model export
const Flashcard =
  (mongoose.models.Flashcard as Model<IFlashcard>) ||
  mongoose.model<IFlashcard>("Flashcard", FlashcardSchema);

export default Flashcard;
