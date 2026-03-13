import { useState } from "react";
import { IFlashcard } from "@/types/flashcard";
import FlashcardItem from "./FlashcardItem";
import EmptyFlashcards from "./EmptyFlashcards";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FlashcardsListProps {
  flashcards: IFlashcard[];
  onEdit?: (flashcard: IFlashcard) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

const FlashcardsList = ({
  flashcards,
  onEdit,
  onDelete,
}: FlashcardsListProps) => {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? flashcards.filter(
        (f) =>
          f.term.toLowerCase().includes(search.toLowerCase()) ||
          f.definition.toLowerCase().includes(search.toLowerCase())
      )
    : flashcards;

  return (
    <div className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-editorial tracking-tight">Flashcards</h2>
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border-2 border-border bg-lilac text-sm font-bold shadow-sm">
            {flashcards.length}
          </div>
        </div>

        {flashcards.length > 5 && (
          <div className="relative w-full sm:w-72 mt-2 sm:mt-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 text-base rounded-xl border-2 border-border bg-background focus:-translate-y-1 focus:shadow-bento-sm transition-all focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border"
            />
          </div>
        )}
      </div>

      {flashcards.length === 0 ? (
        <EmptyFlashcards />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No cards match &quot;{search}&quot;</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((flashcard, index) => (
            <FlashcardItem
              key={flashcard._id || index}
              flashcard={flashcard}
              index={index}
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
