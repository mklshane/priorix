import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDeckActivity extends Document {
  userId: mongoose.Types.ObjectId;
  deckId: mongoose.Types.ObjectId;
  lastAccessedAt: Date;
}

const UserDeckActivitySchema: Schema<IUserDeckActivity> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deckId: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const UserDeckActivity: Model<IUserDeckActivity> =
  (mongoose.models && mongoose.models.UserDeckActivity) ||
  mongoose.model<IUserDeckActivity>("UserDeckActivity", UserDeckActivitySchema);

export default UserDeckActivity;
