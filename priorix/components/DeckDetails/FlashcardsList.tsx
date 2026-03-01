// components/DeckDetails/FlashcardsList.tsx
import { useState } from "react";
import { IFlashcard } from "@/types/flashcard";
import FlashcardItem from "./FlashcardItem";
import EmptyFlashcards from "./EmptyFlashcards";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Layers, Search } from "lucide-react";

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
    <div className="mb-8">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-purple/15 dark:bg-purple/25">
            <Layers className="h-4 w-4 text-purple" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Flashcards</h2>
          <Badge
            variant="secondary"
            className="text-xs font-bold tabular-nums"
          >
            {flashcards.length}
          </Badge>
        </div>

        {flashcards.length > 5 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm border-2 border-primary/30 dark:border-darkborder focus:border-purple"
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
