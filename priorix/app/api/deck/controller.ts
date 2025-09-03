import mongoose from "mongoose";
import Deck from "@/lib/models/Deck";
import Flashcard from "@/lib/models/Flashcard";
import UserDeckActivity from "@/lib/models/UserDeckActivity";
import { ConnectDB } from "@/lib/config/db";

export const getDecks = async (params: {
  deckId?: string;
  userId?: string;
}) => {
  const { deckId, userId } = params;
  await ConnectDB();

  if (!mongoose.models.Flashcard) {
    require("@/lib/models/Flashcard");
  }

  if (deckId) {
    const deck = await Deck.findById(deckId)
      .populate("flashcards")
      .populate("user", "name"); 
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

  if (userId) {
    return Deck.find({
      $or: [{ user: userId }, { sharedWith: userId }],
    })
      .populate("flashcards")
      .populate("user", "name"); 
  }

  return Deck.find({ isPublic: true })
    .populate("flashcards")
    .populate("user", "name"); 
};

// Create a new deck
export const createDeck = async (data: {
  title: string;
  description?: string;
  isPublic?: boolean;
  userId: string;
}) => {
  await ConnectDB();
  const { title, description, isPublic, userId } = data;
  const deck = await Deck.create({
    title,
    description,
    isPublic,
    user: userId,
  });
  
  return deck.populate("user", "name");
};

// Update deck
export const updateDeck = async (data: {
  deckId: string;
  title?: string;
  description?: string;
  isPublic?: boolean;
  sharedWith?: string[];
}) => {
  await ConnectDB();
  const { deckId, title, description, isPublic, sharedWith } = data;
  const deck = await Deck.findByIdAndUpdate(
    deckId,
    { title, description, isPublic, sharedWith },
    { new: true }
  ).populate("user", "name"); 
  if (!deck) throw new Error("Deck not found");
  return deck;
};
