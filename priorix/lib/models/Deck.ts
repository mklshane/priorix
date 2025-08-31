import mongoose, { Schema, Document, Model } from "mongoose";
import { IFlashcard } from "./Flashcard";

export interface IDeck extends Document {
  title: string;
  description?: string;
  user: mongoose.Types.ObjectId; // owner of the deck
  flashcards: mongoose.Types.ObjectId[] | IFlashcard[];
  isPublic: boolean; // whether the deck is public
  sharedWith?: mongoose.Types.ObjectId[]; // users who can access the deck
  createdAt: Date;
  updatedAt: Date;
}

const DeckSchema: Schema<IDeck> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    flashcards: [{ type: Schema.Types.ObjectId, ref: "Flashcard" }],
    isPublic: { type: Boolean, default: false },
    sharedWith: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Deck: Model<IDeck> =
  (mongoose.models && mongoose.models.Deck) ||
  mongoose.model<IDeck>("Deck", DeckSchema);

export default Deck;
