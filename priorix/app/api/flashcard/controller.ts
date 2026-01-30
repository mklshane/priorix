import Flashcard from "@/lib/models/Flashcard";
import UserCardProgress from "@/lib/models/UserCardProgress";
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

export const getFlashcards = async (deckId: string, userId?: string) => {
  await ConnectDB();
  const cards = await Flashcard.find({ deck: deckId });

  if (!userId) return cards.map(withStaleness);

  const progressMap = new Map<string, any>();
  const progressDocs = await UserCardProgress.find({
    userId,
    cardId: { $in: cards.map((c) => c._id) },
  });
  progressDocs.forEach((p: any) => progressMap.set(String(p.cardId), p));

  return cards.map((card) => {
    const plain = card.toObject();
    const prog = progressMap.get(String(card._id));
    if (!prog) return withStaleness(plain);
    const plainProg = prog.toObject();
    return {
      ...plain,
      ...plainProg,
      _id: plain._id,
      cardId: plain._id,
      progressId: plainProg._id,
      stalenessStatus: computeStalenessStatus(plainProg),
    };
  });
};

export const createFlashcard = async (data: {
  term: string;
  definition: string;
  deck: string;
}) => {
  await ConnectDB();

  const flashcard = await Flashcard.create({
    term: data.term,
    definition: data.definition,
    deck: data.deck,
  });

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
