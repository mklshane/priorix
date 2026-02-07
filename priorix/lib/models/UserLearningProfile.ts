import mongoose, { Schema, Document, Model } from "mongoose";

export type LearningSpeed = "slow" | "medium" | "fast";

export interface IUserLearningProfile extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  learningSpeed: LearningSpeed;
  optimalSessionLength: number; // cards per session
  preferredStudyTimes: number[]; // array of hours (0-23)
  totalStudyTime: number; // total minutes studied
  currentStreak: number; // consecutive days studied
  longestStreak: number;
  lastStudyDate: Date | null;
  averageRetention: number; // 0-100
  dailyReviewGoal: number; // cards per day
  difficultyPreference: "challenge" | "balanced" | "confidence";
  enableSmartNotifications: boolean;
  personalMultipliers: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
  calibrationReviews: number; // count for initial calibration
  isCalibrated: boolean;
  lastCalibrationDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserLearningProfileSchema = new Schema<IUserLearningProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    learningSpeed: {
      type: String,
      enum: ["slow", "medium", "fast"],
      default: "medium",
    },
    optimalSessionLength: {
      type: Number,
      default: 20,
      min: 5,
      max: 100,
    },
    preferredStudyTimes: {
      type: [Number],
      default: [],
      validate: {
        validator: function (times: number[]) {
          return times.every((t) => t >= 0 && t <= 23);
        },
        message: "Study times must be between 0 and 23",
      },
    },
    totalStudyTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastStudyDate: {
      type: Date,
      default: null,
    },
    averageRetention: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    dailyReviewGoal: {
      type: Number,
      default: 20,
      min: 1,
      max: 200,
    },
    difficultyPreference: {
      type: String,
      enum: ["challenge", "balanced", "confidence"],
      default: "balanced",
    },
    enableSmartNotifications: {
      type: Boolean,
      default: true,
    },
    personalMultipliers: {
      again: {
        type: Number,
        default: 1.0,
      },
      hard: {
        type: Number,
        default: 1.2,
      },
      good: {
        type: Number,
        default: 2.5,
      },
      easy: {
        type: Number,
        default: 3.5,
      },
    },
    calibrationReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    isCalibrated: {
      type: Boolean,
      default: false,
    },
    lastCalibrationDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const UserLearningProfile: Model<IUserLearningProfile> =
  mongoose.models.UserLearningProfile ||
  mongoose.model<IUserLearningProfile>(
    "UserLearningProfile",
    UserLearningProfileSchema
  );

export default UserLearningProfile;
