import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  deckId: mongoose.Types.ObjectId;
}

const FavoriteSchema: Schema<IFavorite> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deckId: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
  },
  {
    timestamps: true,
  }
);

FavoriteSchema.index({ userId: 1, deckId: 1 }, { unique: true });

const Favorite: Model<IFavorite> =
  mongoose.models.Favorite ||
  mongoose.model<IFavorite>("Favorite", FavoriteSchema);

export default Favorite;
