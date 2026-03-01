import mongoose, { Document, Model, Schema } from "mongoose";

export interface INote extends Document {
	title: string;
	content: unknown;
	contentText: string;
	excerpt?: string;
	user: mongoose.Types.ObjectId;
	folder?: mongoose.Types.ObjectId | null;
	tags?: string[];
	lastOpenedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
	{
		title: { type: String, required: true, trim: true },
		content: { type: Schema.Types.Mixed, default: "" },
		contentText: { type: String, default: "" },
		excerpt: { type: String, trim: true, maxlength: 240 },
		user: { type: Schema.Types.ObjectId, ref: "User", required: true },
		folder: { type: Schema.Types.ObjectId, ref: "NoteFolder", default: null },
		tags: [{ type: String, trim: true }],
		lastOpenedAt: { type: Date, default: null },
	},
	{
		timestamps: true,
	}
);

NoteSchema.index({ user: 1, title: 1 });
NoteSchema.index({ user: 1, updatedAt: -1 });
NoteSchema.index({ user: 1, folder: 1 });

const Note: Model<INote> =
	(mongoose.models && mongoose.models.Note) ||
	mongoose.model<INote>("Note", NoteSchema);

export default Note;
