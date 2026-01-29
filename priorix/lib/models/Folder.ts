import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFolder extends Document {
  name: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema: Schema<IFolder> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

FolderSchema.index({ user: 1, name: 1 }, { unique: true });

const Folder: Model<IFolder> =
  (mongoose.models && mongoose.models.Folder) ||
  mongoose.model<IFolder>("Folder", FolderSchema);

export default Folder;
