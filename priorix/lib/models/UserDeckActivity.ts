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

UserDeckActivitySchema.index({ userId: 1, deckId: 1 }, { unique: true });

const UserDeckActivity: Model<IUserDeckActivity> =
  mongoose.models.UserDeckActivity ||
  mongoose.model<IUserDeckActivity>("UserDeckActivity", UserDeckActivitySchema);

export const recordDeckAccess = async (
  userId: mongoose.Types.ObjectId,
  deckId: mongoose.Types.ObjectId
) => {
  return await UserDeckActivity.findOneAndUpdate(
    { userId, deckId },
    { $set: { lastAccessedAt: new Date() } },
    { upsert: true, new: true }
  );
};

export default UserDeckActivity;
