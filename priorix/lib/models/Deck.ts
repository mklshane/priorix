import mongoose, { Schema, Document, Model } from "mongoose";
import { IFlashcard } from "./Flashcard";

export interface IDeck extends Document {
  title: string;
  description?: string;
  user: mongoose.Types.ObjectId; // owner of the deck
  userName?: string; // Store the user's name for easier access
  folder?: mongoose.Types.ObjectId | null; // optional folder container
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
    userName: { type: String, trim: true }, // Store user's name
    folder: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    flashcards: [{ type: Schema.Types.ObjectId, ref: "Flashcard" }],
    isPublic: { type: Boolean, default: false },
    sharedWith: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Middleware to automatically set userName when saving
DeckSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("user")) {
    try {
      const User = mongoose.model("User");
      const user = await User.findById(this.user);
      if (user && user.name) {
        this.userName = user.name.split(" ")[0]; // Store first name
      }
    } catch (error) {
      console.error("Error setting user name:", error);
    }
  }
  next();
});

const Deck: Model<IDeck> =
  (mongoose.models && mongoose.models.Deck) ||
  mongoose.model<IDeck>("Deck", DeckSchema);

export default Deck;
