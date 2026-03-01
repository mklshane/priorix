import mongoose from "mongoose";
import { ConnectDB } from "@/lib/config/db";
import NoteFolder from "@/lib/models/NoteFolder";
import Note from "@/lib/models/Note";

export const listNoteFolders = async (userId: string, includeCounts?: boolean) => {
  await ConnectDB();

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const folders = await NoteFolder.find({ user: userObjectId }).sort({ createdAt: -1 });

  if (!includeCounts) {
    return folders;
  }

  const counts = await Note.aggregate([
    { $match: { user: userObjectId } },
    {
      $group: {
        _id: "$folder",
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = counts.reduce<Record<string, number>>((acc, item) => {
    if (item._id) {
      acc[item._id.toString()] = item.count;
    }
    return acc;
  }, {});

  return folders.map((folder) => {
    const folderObject = folder.toObject();
    const id =
      folder._id instanceof mongoose.Types.ObjectId
        ? folder._id.toString()
        : String(folder._id);

    return {
      ...folderObject,
      noteCount: countMap[id] ?? 0,
    };
  });
};

export const createNoteFolder = async (params: { userId: string; name: string }) => {
  await ConnectDB();

  const name = params.name.trim();
  const userObjectId = new mongoose.Types.ObjectId(params.userId);

  const existing = await NoteFolder.findOne({ user: userObjectId, name });
  if (existing) {
    throw new Error("Folder with this name already exists");
  }

  return NoteFolder.create({
    name,
    user: userObjectId,
  });
};

export const updateNoteFolder = async (params: {
  userId: string;
  folderId: string;
  name: string;
}) => {
  await ConnectDB();

  const updated = await NoteFolder.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(params.folderId),
      user: new mongoose.Types.ObjectId(params.userId),
    },
    { name: params.name.trim() },
    { new: true }
  );

  if (!updated) {
    throw new Error("Folder not found or not owned by user");
  }

  return updated;
};

export const deleteNoteFolder = async (params: { userId: string; folderId: string }) => {
  await ConnectDB();

  const userObjectId = new mongoose.Types.ObjectId(params.userId);
  const folderObjectId = new mongoose.Types.ObjectId(params.folderId);

  const folder = await NoteFolder.findOne({ _id: folderObjectId, user: userObjectId });
  if (!folder) {
    throw new Error("Folder not found or not owned by user");
  }

  const noteCount = await Note.countDocuments({
    user: userObjectId,
    folder: folderObjectId,
  });

  if (noteCount > 0) {
    throw new Error("This folder contains notes. Move or delete them first.");
  }

  await NoteFolder.deleteOne({ _id: folderObjectId });

  return { message: "Folder deleted" };
};
