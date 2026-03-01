import mongoose, { Document, Model, Schema } from "mongoose";

export interface INoteFolder extends Document {
  name: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoteFolderSchema = new Schema<INoteFolder>(
  {
    name: { type: String, required: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

NoteFolderSchema.index({ user: 1, name: 1 }, { unique: true });

const NoteFolder: Model<INoteFolder> =
  (mongoose.models && mongoose.models.NoteFolder) ||
  mongoose.model<INoteFolder>("NoteFolder", NoteFolderSchema);

export default NoteFolder;
