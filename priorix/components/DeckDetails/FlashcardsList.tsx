// components/DeckDetails/FlashcardsList.tsx
import { IFlashcard } from "@/types/flashcard";
import FlashcardItem from "./FlashcardItem";
import EmptyFlashcards from "./EmptyFlashcards";

interface FlashcardsListProps {
  flashcards: IFlashcard[];
  onEdit?: (flashcard: IFlashcard) => void; // Make optional
  onDelete?: (id: string) => void; // Make optional
  isOwner?: boolean;
}

const FlashcardsList = ({
  flashcards,
  onEdit,
  onDelete,
}: FlashcardsListProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Flashcards</h2>

      {flashcards.length === 0 ? (
        <EmptyFlashcards />
      ) : (
        <div className="grid gap-4">
          {flashcards.map((flashcard, index) => (
            <FlashcardItem
              key={flashcard._id || index}
              flashcard={flashcard}
              onEdit={onEdit}
              onDelete={onDelete} 
              
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardsList;
