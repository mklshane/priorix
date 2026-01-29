import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFlashcard extends Document {
  term: string;
  definition: string;
  deck: mongoose.Types.ObjectId;
  easeFactor?: number;
  intervalDays?: number;
  lastReviewedAt?: Date | null;
  nextReviewAt?: Date | null;
  reviewCount?: number;
  againCount?: number;
  hardCount?: number;
  goodCount?: number;
  easyCount?: number;
  averageResponseTime?: number;
  currentState?: "new" | "learning" | "review" | "relearning";
  learningStepIndex?: number;
  lapseCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema: Schema<IFlashcard> = new Schema(
  {
    term: { type: String, required: true, trim: true },
    definition: { type: String, required: true, trim: true },
    deck: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
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
  },
  { timestamps: true }
);

// Simple and direct model export
const Flashcard =
  (mongoose.models.Flashcard as Model<IFlashcard>) ||
  mongoose.model<IFlashcard>("Flashcard", FlashcardSchema);

export default Flashcard;
