import Flashcard from "@/lib/models/Flashcard";
import { ConnectDB } from "@/lib/config/db";
import Deck from "@/lib/models/Deck";

const forgottenThresholdMs = 14 * 24 * 60 * 60 * 1000;

const computeStalenessStatus = (card: any) => {
  const lastReviewed = card.lastReviewedAt ? new Date(card.lastReviewedAt) : null;
  if (!lastReviewed) return "notYet";
  const diff = Date.now() - lastReviewed.getTime();
  return diff >= forgottenThresholdMs ? "forgotten" : "recent";
};

const withStaleness = (card: any) => {
  const plain = card.toObject ? card.toObject() : card;
  return { ...plain, stalenessStatus: computeStalenessStatus(plain) };
};

export const getFlashcards = async (deckId: string) => {
  await ConnectDB();
  const cards = await Flashcard.find({ deck: deckId });
  return cards.map(withStaleness);
};

export const createFlashcard = async (data: {
  term: string;
  definition: string;
  deck: string;
}) => {
  await ConnectDB();

  const flashcard = await Flashcard.create(data);

  await Deck.findByIdAndUpdate(data.deck, {
    $push: { flashcards: flashcard._id },
  });

  return withStaleness(flashcard);
};

export const updateFlashcard = async (data: {
  id: string;
  term?: string;
  definition?: string;
}) => {
  await ConnectDB();
  const flashcard = await Flashcard.findByIdAndUpdate(
    data.id,
    { term: data.term, definition: data.definition },
    { new: true }
  );
  if (!flashcard) throw new Error("Flashcard not found");
  return withStaleness(flashcard);
};

export const deleteFlashcard = async (id: string) => {
  await ConnectDB();
  const deleted = await Flashcard.findByIdAndDelete(id);
  if (!deleted) throw new Error("Flashcard not found");
  return withStaleness(deleted);
};
