import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecurring {
  frequency: "daily" | "weekly" | "monthly" | "custom";
  interval?: number;
  endDate?: Date;
}

export interface ITask extends Document {
  taskTitle: string;
  description?: string;
  status: "todo" | "in-progress" | "completed";
  dueDate?: Date;
  dueTime?: string;
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[];
  color?: string;
  linkedDeck?: mongoose.Types.ObjectId;
  linkedNote?: mongoose.Types.ObjectId;
  recurring?: IRecurring;
  createdBy: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "custom"],
      required: true,
    },
    interval: {
      type: Number,
      min: 1,
      default: 1,
    },
    endDate: {
      type: Date,
    },
  },
  { _id: false }
);

const TaskSchema: Schema<ITask> = new Schema(
  {
    taskTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "completed"],
      default: "todo",
    },
    dueDate: {
      type: Date,
    },
    dueTime: {
      type: String,
      trim: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    color: {
      type: String,
      trim: true,
    },
    linkedDeck: {
      type: Schema.Types.ObjectId,
      ref: "Deck",
    },
    linkedNote: {
      type: Schema.Types.ObjectId,
      ref: "Note",
    },
    recurring: {
      type: RecurringSchema,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ createdBy: 1, status: 1 });
TaskSchema.index({ createdBy: 1, dueDate: 1 });
TaskSchema.index({ createdBy: 1, dueDate: 1, priority: 1 });

// Virtual for isOverdue
TaskSchema.virtual("isOverdue").get(function () {
  return (
    this.dueDate && this.dueDate < new Date() && this.status !== "completed"
  );
});

// Virtual for isDueSoon (within 24 hours)
TaskSchema.virtual("isDueSoon").get(function () {
  if (!this.dueDate || this.status === "completed") return false;
  const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return this.dueDate <= twentyFourHoursFromNow;
});

const Task: Model<ITask> =
  (mongoose.models.Task as Model<ITask>) ||
  mongoose.model<ITask>("Task", TaskSchema);

export default Task;
