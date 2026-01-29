import mongoose from "mongoose";
import Deck from "@/lib/models/Deck";
import UserDeckActivity from "@/lib/models/UserDeckActivity";
import Folder from "@/lib/models/Folder";
import { ConnectDB } from "@/lib/config/db";

// Ensure referenced models are registered for populate on cold starts
import "@/lib/models/User";
import "@/lib/models/Flashcard";

export const getDecks = async (params: {
  deckId?: string;
  userId?: string;
  folderId?: string | null;
}) => {
  const { deckId, userId, folderId } = params;
  await ConnectDB();

  if (!mongoose.models.Flashcard) {
    require("@/lib/models/Flashcard");
  }

  if (!mongoose.models.Folder) {
    require("@/lib/models/Folder");
  }

  if (deckId) {
    const deck = await Deck.findById(deckId)
      .populate("flashcards")
      .populate("user", "name")
      .populate("folder", "name");
    if (!deck) throw new Error("Deck not found");

    if (userId) {
      await UserDeckActivity.findOneAndUpdate(
        { userId, deckId: deck._id },
        { lastAccessedAt: new Date() },
        { upsert: true }
      );
    }

    return deck;
  }

  const folderFilter = (() => {
    if (folderId === undefined) return {};
    if (folderId === null) {
      return { $or: [{ folder: null }, { folder: { $exists: false } }] };
    }
    return { folder: folderId };
  })();

  if (userId) {
    return Deck.find({
      $and: [
        { $or: [{ user: userId }, { sharedWith: userId }] },
        folderFilter,
      ],
    })
      .populate("flashcards")
      .populate("user", "name")
      .populate("folder", "name");
  }

  return Deck.find({ isPublic: true, ...folderFilter })
    .populate("flashcards")
    .populate("user", "name")
    .populate("folder", "name");
};

export const createDeck = async (data: {
  title: string;
  description?: string;
  isPublic?: boolean;
  userId: string;
  folderId?: string | null;
}) => {
  await ConnectDB();
  const { title, description, isPublic, userId, folderId } = data;

  let folder = null;
  if (folderId) {
    folder = await Folder.findOne({ _id: folderId, user: userId });
    if (!folder) {
      throw new Error("Folder not found or not owned by user");
    }
  }

  const deck = await Deck.create({
    title,
    description,
    isPublic,
    user: userId,
    folder: folder ? folder._id : null,
  });
  
  return deck.populate("user", "name");
};

export const updateDeck = async (data: {
  deckId: string;
  title?: string;
  description?: string;
  isPublic?: boolean;
  sharedWith?: string[];
  folderId?: string | null;
}) => {
  await ConnectDB();
  const { deckId, title, description, isPublic, sharedWith, folderId } = data;

  let folderUpdate: mongoose.Types.ObjectId | null | undefined = undefined;
  if (folderId !== undefined) {
    if (folderId === null) {
      folderUpdate = null;
    } else {
      const folder = await Folder.findById(folderId);
      if (!folder) {
        throw new Error("Folder not found");
      }
      folderUpdate = folder._id;
    }
  }

  const updatePayload: Record<string, unknown> = {
    title,
    description,
    isPublic,
    sharedWith,
  };

  if (folderUpdate !== undefined) {
    updatePayload.folder = folderUpdate;
  }

  const deck = await Deck.findByIdAndUpdate(
    deckId,
    updatePayload,
    { new: true }
  )
    .populate("user", "name")
    .populate("folder", "name");
  if (!deck) throw new Error("Deck not found");
  return deck;
};
