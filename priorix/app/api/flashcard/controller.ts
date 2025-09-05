import Flashcard from "@/lib/models/Flashcard";
import { ConnectDB } from "@/lib/config/db";
import Deck from "@/lib/models/Deck";

export const getFlashcards = async (deckId: string) => {
  await ConnectDB();
  return Flashcard.find({ deck: deckId });
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

  return flashcard;
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
  return flashcard;
};

export const deleteFlashcard = async (id: string) => {
  await ConnectDB();
  const deleted = await Flashcard.findByIdAndDelete(id);
  if (!deleted) throw new Error("Flashcard not found");
  return deleted;
};
