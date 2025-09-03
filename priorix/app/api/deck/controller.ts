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

// Delete deck
export const deleteDeck = async (deckId: string) => {
  await ConnectDB();
  
  console.log("=== STARTING DECK DELETION ===");
  console.log("Deck ID:", deckId);

  try {
    // Verify the deck exists first
    const deck = await Deck.findById(deckId);
    if (!deck) {
      console.log("Deck not found in database");
      throw new Error("Deck not found");
    }
    console.log("Deck found:", deck.title);

    // Manually import models to ensure they're registered
    const Flashcard = (await import("@/lib/models/Flashcard")).default;
    const UserDeckActivity = (await import("@/lib/models/UserDeckActivity")).default;

    // Check if models are properly registered
    console.log("Flashcard model registered:", mongoose.models.Flashcard !== undefined);
    console.log("UserDeckActivity model registered:", mongoose.models.UserDeckActivity !== undefined);

    // Count flashcards before deletion
    const flashcardCount = await Flashcard.countDocuments({ deck: deckId });
    console.log("Flashcards to delete:", flashcardCount);

    // Delete all flashcards associated with the deck
    const flashcardResult = await Flashcard.deleteMany({ deck: deckId });
    console.log("Deleted flashcards result:", flashcardResult);

    // Count user activities before deletion
    const activityCount = await UserDeckActivity.countDocuments({ deckId: deckId });
    console.log("User activities to delete:", activityCount);

    // Delete user activity records
    const activityResult = await UserDeckActivity.deleteMany({ deckId: deckId });
    console.log("Deleted user activities result:", activityResult);

    // Finally delete the deck itself
    console.log("Deleting deck...");
    const deletedDeck = await Deck.findByIdAndDelete(deckId);
    
    if (!deletedDeck) {
      console.log("Failed to delete deck - no result from findByIdAndDelete");
      throw new Error("Failed to delete deck");
    }

    console.log("Deck successfully deleted");
    console.log("=== DECK DELETION COMPLETE ===");

    return deletedDeck;
  } catch (error) {
    console.error("Error in deleteDeck:", error);
    throw new Error(`Failed to delete deck`);
  }
};