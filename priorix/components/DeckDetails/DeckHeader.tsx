import { Button } from "@/components/ui/button";
import { Deck } from "@/types/deck";
import { IFlashcard } from "@/types/flashcard";
import DeckStats from "./DeckStats";
import { User, Sparkles, BookOpen, Share2 } from "lucide-react";
import { useDeckContext } from "@/contexts/DeckContext";

interface DeckHeaderProps {
  deck: Deck;
  flashcards: IFlashcard[];
  onStudyClick: () => void;
  onImportPDF?: () => void;
}

const DeckHeader = ({
  deck,
  flashcards,
  onStudyClick,
  onImportPDF,
}: DeckHeaderProps) => {
  const { isOwner } = useDeckContext();

  const getDisplayName = () => {
    if (deck.user && typeof deck.user === "object" && deck.user.name) {
      return deck.user.name;
    }
    if (typeof deck.user === "string") {
      return deck.user;
    }
    return "Unknown Creator";
  };

  return (
    <div className="mb-10 md:mb-16">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            {!isOwner && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-border bg-citrus text-[10px] font-bold uppercase tracking-widest text-foreground">
                <Share2 className="h-3 w-3" /> Shared
              </div>
            )}
            {/* Creator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-border bg-background text-[10px] font-bold uppercase tracking-widest text-foreground">
              <User className="h-3.5 w-3.5" />
              <span>By {getDisplayName()}</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-editorial tracking-tight mb-4 text-foreground break-words">
            {deck.title}
          </h1>

          {deck.description && (
            <p className="text-lg md:text-xl text-muted-foreground font-sans max-w-2xl leading-relaxed">
              {deck.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-row gap-4 md:flex-col md:items-stretch pl-0 md:pl-8 shrink-0">
          {flashcards.length > 0 && (
            <Button
              onClick={onStudyClick}
              className="flex items-center justify-center gap-2 px-8 py-6 rounded-full border-2 border-border bg-tangerine  text-primary font-bold text-lg hover:-translate-y-1 hover:shadow-bento transition-all duration-300 active:translate-y-0 active:shadow-none"
            >
              <BookOpen className="h-5 w-5" />
              Study Now
            </Button>
          )}
          {isOwner && onImportPDF && (
            <Button
              variant="outline"
              onClick={onImportPDF}
              className="flex items-center justify-center gap-2 px-6 py-6 rounded-full border-2 border-border bg-mint text-foreground font-bold text-base hover:-translate-y-1 hover:shadow-bento-sm transition-all duration-300 active:translate-y-0 active:shadow-none"
            >
              <Sparkles className="h-5 w-5" />
              <span>Magic Import</span>
            </Button>
          )}
        </div>
      </div>

      <DeckStats
        flashcardCount={flashcards.length}
        createdAt={deck.createdAt}
        isPublic={deck.isPublic}
      />
    </div>
  );
};

export default DeckHeader;
