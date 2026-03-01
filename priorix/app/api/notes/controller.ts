import mongoose from "mongoose";
import { ConnectDB } from "@/lib/config/db";
import Note from "@/lib/models/Note";
import NoteFolder from "@/lib/models/NoteFolder";

export type NoteSortBy = "date" | "name" | "recent";

const toExcerpt = (text: string) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 180 ? `${normalized.slice(0, 180)}...` : normalized;
};

export const listNotes = async (params: {
  userId: string;
  folderId?: string | null;
  search?: string;
  sortBy?: NoteSortBy;
}) => {
  const { userId, folderId, search, sortBy = "date" } = params;
  await ConnectDB();

  const conditions: Record<string, unknown>[] = [
    { user: new mongoose.Types.ObjectId(userId) },
  ];

  if (folderId === null) {
    conditions.push({ $or: [{ folder: null }, { folder: { $exists: false } }] });
  } else if (folderId) {
    conditions.push({ folder: new mongoose.Types.ObjectId(folderId) });
  }

  if (search?.trim()) {
    const regex = new RegExp(search.trim(), "i");
    conditions.push({
      $or: [
      { title: regex },
      { contentText: regex },
      { excerpt: regex },
      ],
    });
  }

  const filter = conditions.length === 1 ? conditions[0] : { $and: conditions };

  const sort: Record<string, 1 | -1> =
    sortBy === "name"
      ? { title: 1 }
      : sortBy === "recent"
      ? { lastOpenedAt: -1, updatedAt: -1 }
      : { createdAt: -1 };

  return Note.find(filter).sort(sort).populate("folder", "name");
};

export const getNoteById = async (userId: string, noteId: string) => {
  await ConnectDB();

  const note = await Note.findOne({
    _id: noteId,
    user: new mongoose.Types.ObjectId(userId),
  }).populate("folder", "name");

  if (!note) {
    throw new Error("Note not found");
  }

  await Note.findByIdAndUpdate(noteId, { $set: { lastOpenedAt: new Date() } });
  return note;
};

export const createNote = async (params: {
  userId: string;
  title: string;
  folderId?: string | null;
  content?: unknown;
  contentText?: string;
}) => {
  const { userId, title, folderId, content = "", contentText = "" } = params;
  await ConnectDB();

  let folder: mongoose.Types.ObjectId | null = null;
  if (folderId) {
    const existingFolder = await NoteFolder.findOne({
      _id: folderId,
      user: new mongoose.Types.ObjectId(userId),
    });
    if (!existingFolder) {
      throw new Error("Folder not found or not owned by user");
    }
    folder = existingFolder._id as mongoose.Types.ObjectId;
  }

  const note = await Note.create({
    title,
    user: new mongoose.Types.ObjectId(userId),
    folder,
    content,
    contentText,
    excerpt: toExcerpt(contentText),
  });

  return note.populate("folder", "name");
};

export const updateNote = async (params: {
  userId: string;
  noteId: string;
  title?: string;
  folderId?: string | null;
  content?: unknown;
  contentText?: string;
}) => {
  const { userId, noteId, title, folderId, content, contentText } = params;
  await ConnectDB();

  const note = await Note.findOne({
    _id: noteId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!note) {
    throw new Error("Note not found");
  }

  if (title !== undefined) {
    note.title = title.trim();
  }

  if (folderId !== undefined) {
    if (folderId === null) {
      note.folder = null;
    } else {
      const folder = await NoteFolder.findOne({
        _id: folderId,
        user: new mongoose.Types.ObjectId(userId),
      });
      if (!folder) {
        throw new Error("Folder not found or not owned by user");
      }
      note.folder = folder._id as mongoose.Types.ObjectId;
    }
  }

  if (content !== undefined) {
    note.content = content;
  }

  if (contentText !== undefined) {
    note.contentText = contentText;
    note.excerpt = toExcerpt(contentText);
  }

  await note.save();

  return note.populate("folder", "name");
};

export const deleteNote = async (userId: string, noteId: string) => {
  await ConnectDB();

  const deleted = await Note.findOneAndDelete({
    _id: noteId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!deleted) {
    throw new Error("Note not found");
  }

  return { message: "Note deleted" };
};
