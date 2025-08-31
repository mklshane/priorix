import mongoose, { Schema, Document, Model} from "mongoose";

export interface IFlashcard extends Document {
    term: string,
    definition: string,
    deck: mongoose.Types.ObjectId, // reference to deck
    createdAt: Date,
    updatedAt: Date,
}

const FlashcardSchema: Schema<IFlashcard> = new Schema(
    {
        term: { type: String, required: true, trim: true},
        definition: { type: String, required: true, trim: true},
        deck: { type: Schema.Types.ObjectId, ref: "Deck", required: true}
    },
    { timestamps: true }
);

const Flashcard: Model<IFlashcard> = (mongoose.models && mongoose.models.Flashcard) || mongoose.model<IFlashcard>("Flashcard", FlashcardSchema);

export default Flashcard;