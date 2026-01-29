import { ConnectDB } from "@/lib/config/db";
import Folder from "@/lib/models/Folder";
import Deck from "@/lib/models/Deck";
import mongoose from "mongoose";

export const listFolders = async (userId: string, includeCounts?: boolean) => {
  await ConnectDB();

  const folders = await Folder.find({ user: userId }).sort({ createdAt: -1 });

  if (!includeCounts) return folders;

  const counts = await Deck.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$folder",
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = counts.reduce<Record<string, number>>((acc, c) => {
    if (c._id) acc[c._id.toString()] = c.count;
    return acc;
  }, {});

  return folders.map((folder) => {
    const f = folder.toObject();
    const id = folder._id instanceof mongoose.Types.ObjectId ? folder._id.toString() : String(folder._id);
    return {
      ...f,
      deckCount: countMap[id] ?? 0,
    };
  });
};

export const createFolder = async (data: { name: string; userId: string }) => {
  await ConnectDB();
  const { name, userId } = data;

  const existing = await Folder.findOne({ name: name.trim(), user: userId });
  if (existing) {
    throw new Error("Folder with this name already exists");
  }

  const folder = await Folder.create({ name: name.trim(), user: userId });
  return folder;
};

export const updateFolder = async (data: {
  folderId: string;
  name: string;
  userId: string;
}) => {
  await ConnectDB();
  const { folderId, name, userId } = data;

  const folder = await Folder.findOneAndUpdate(
    { _id: folderId, user: userId },
    { name: name.trim() },
    { new: true }
  );

  if (!folder) {
    throw new Error("Folder not found or not owned by user");
  }

  return folder;
};

export const deleteFolder = async (data: { folderId: string; userId: string }) => {
  await ConnectDB();
  const { folderId, userId } = data;

  const folder = await Folder.findOne({ _id: folderId, user: userId });
  if (!folder) {
    throw new Error("Folder not found or not owned by user");
  }

  const deckCount = await Deck.countDocuments({ folder: folderId });
  if (deckCount > 0) {
    throw new Error("This folder contains decks. Move or delete them first.");
  }

  await Folder.deleteOne({ _id: folderId });
  return { message: "Folder deleted" };
};
