import { ConnectDB } from "@/lib/config/db";
import Deck from "@/lib/models/Deck";
import UserDeckActivity from "@/lib/models/UserDeckActivity";
import Flashcard from "@/lib/models/Flashcard";

// Fetch decks: single, user, or public
export const getDecks = async (params: {
  deckId?: string;
  userId?: string;
}) => {
  const { deckId, userId } = params;
  await ConnectDB();

  if (deckId) {
    const deck = await Deck.findById(deckId).populate("flashcards");
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
    }).populate("flashcards");
  }

  return Deck.find({ isPublic: true }).populate("flashcards");
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
  return Deck.create({ title, description, isPublic, user: userId });
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
  );
  if (!deck) throw new Error("Deck not found");
  return deck;
};

// Delete deck
export const deleteDeck = async (deckId: string) => {
    await ConnectDB();
  const deleted = await Deck.findByIdAndDelete(deckId);
  if (!deleted) throw new Error("Deck not found");
  return deleted;
};
