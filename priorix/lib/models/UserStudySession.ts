import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserStudySession extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  deckId: mongoose.Types.ObjectId;
  sessionStart: Date;
  sessionEnd: Date;
  cardsReviewed: number;
  cardsAgain: number;
  cardsHard: number;
  cardsGood: number;
  cardsEasy: number;
  averageAccuracy: number;
  averageResponseTime: number;
  timeOfDay: number; // 0-23 hour
  sessionQuality: number; // 0-100 score
  wasCompleted: boolean;
  studyMode?: "flashcards" | "srs" | "quiz"; // Mode tracking
  quizScore?: number; // Quiz score percentage (0-100)
  quizType?: string; // "mcq", "true-false", "mixed"
  createdAt: Date;
  updatedAt: Date;
}

const UserStudySessionSchema = new Schema<IUserStudySession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deckId: {
      type: Schema.Types.ObjectId,
      ref: "Deck",
      required: true,
      index: true,
    },
    sessionStart: {
      type: Date,
      required: true,
    },
    sessionEnd: {
      type: Date,
      required: true,
    },
    cardsReviewed: {
      type: Number,
      required: true,
      default: 0,
    },
    cardsAgain: {
      type: Number,
      default: 0,
    },
    cardsHard: {
      type: Number,
      default: 0,
    },
    cardsGood: {
      type: Number,
      default: 0,
    },
    cardsEasy: {
      type: Number,
      default: 0,
    },
    averageAccuracy: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    averageResponseTime: {
      type: Number,
      default: 0,
    },
    timeOfDay: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    sessionQuality: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    wasCompleted: {
      type: Boolean,
      default: true,
    },
    studyMode: {
      type: String,
      enum: ["flashcards", "srs", "quiz"],
      default: "srs",
    },
    quizScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    quizType: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
UserStudySessionSchema.index({ userId: 1, sessionStart: -1 });
UserStudySessionSchema.index({ userId: 1, deckId: 1, sessionStart: -1 });
UserStudySessionSchema.index({ userId: 1, timeOfDay: 1 });
UserStudySessionSchema.index({ userId: 1, studyMode: 1, sessionStart: -1 });

const UserStudySession: Model<IUserStudySession> =
  mongoose.models.UserStudySession ||
  mongoose.model<IUserStudySession>("UserStudySession", UserStudySessionSchema);

export default UserStudySession;
