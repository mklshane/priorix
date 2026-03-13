// components/DeckDetails/FlashcardItem.tsx
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { IFlashcard } from "@/types/flashcard";
import { useDeckContext } from "@/contexts/DeckContext";

interface FlashcardItemProps {
  flashcard: IFlashcard;
  index?: number;
  onEdit?: (flashcard: IFlashcard) => void;
  onDelete?: (id: string) => void;
}

const FlashcardItem = ({
  flashcard,
  index,
  onEdit,
  onDelete,
}: FlashcardItemProps) => {
  const { isOwner } = useDeckContext();

  const renderText = (text: string) => {
    return text.split("\n").map((line, i) => (
      <p key={i} className="text-base break-words font-sans">
        {line}
      </p>
    ));
  };

  const handleEdit = () => {
    if (onEdit) onEdit(flashcard);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(flashcard._id);
  };

  const getStatusBadge = () => {
    const isDue = flashcard.nextReviewAt && new Date(flashcard.nextReviewAt) <= new Date();
    if (isDue) {
      return <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-citrus border-2 border-border rounded-full text-[10px] uppercase font-bold tracking-widest text-foreground"><span className="w-1.5 h-1.5 rounded-full bg-border" />Due</div>;
    }
    if (flashcard.currentState === "new" || !flashcard.currentState) {
      return <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-mint border-2 border-border rounded-full text-[10px] uppercase font-bold tracking-widest text-foreground"><span className="w-1.5 h-1.5 rounded-full bg-border" />New</div>;
    }
    if (flashcard.currentState === "learning" || flashcard.currentState === "relearning") {
      return <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tangerine border-2 border-border rounded-full text-[10px] uppercase font-bold tracking-widest text-foreground">Learning</div>;
    }
    return <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-lilac border-2 border-border rounded-full text-[10px] uppercase font-bold tracking-widest text-foreground">Mastered</div>;
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border-2 border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-bento-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        
        <div className="flex items-center justify-between md:flex-col md:items-start gap-2 shrink-0 md:w-28">
           {typeof index === "number" && (
            <span className="font-editorial text-2xl text-muted-foreground mr-2">
              #{index + 1}
            </span>
          )}
          {getStatusBadge()}
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 border-t-2 md:border-t-0 md:border-l-2 border-border/20 pt-4 md:pt-0 md:pl-8">
       
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Term
            </span>
            <div className="text-foreground text-lg leading-relaxed">
              {renderText(flashcard.term)}
            </div>
          </div>

          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Definition
            </span>
            <div className="text-foreground/80 leading-relaxed">
              {renderText(flashcard.definition)}
            </div>
          </div>
        </div>

        {isOwner && onEdit && onDelete && (
          <div className="shrink-0 flex items-center md:flex-col gap-2 mt-4 md:mt-0 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-10 w-10 rounded-xl border-2 border-transparent hover:border-border hover:bg-lilac text-foreground transition-all"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-10 w-10 rounded-xl border-2 border-transparent hover:border-border hover:bg-blush text-foreground hover:text-red-600 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardItem;
