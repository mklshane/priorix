// components/DeckDetails/FlashcardItem.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, GripVertical } from "lucide-react";
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
      <p key={i} className="text-sm break-words leading-relaxed">
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

  return (
    <Card className="group relative overflow-hidden border-2 border-primary/80 dark:border-darkborder bg-card hover:border-primary dark:hover:border-purple/60 transition-all duration-200 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.08)] dark:hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.15)]">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple via-pink to-perry opacity-60 group-hover:opacity-100 transition-opacity" />

      <CardContent className="py-3 pl-5 pr-4">
        <div className="flex items-start gap-3">
          {/* Card number */}
          {typeof index === "number" && (
            <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-lg bg-purple/10 dark:bg-purple/20 text-xs font-bold text-purple mt-0.5">
              {index + 1}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            {/* Term */}
            <div className="md:border-r md:border-border/60 md:pr-6">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Term
              </span>
              <div className="text-foreground font-medium">
                {renderText(flashcard.term)}
              </div>
            </div>

            {/* Definition */}
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Definition
              </span>
              <div className="text-foreground/80">
                {renderText(flashcard.definition)}
              </div>
            </div>
          </div>

          {/* Actions */}
          {isOwner && onEdit && onDelete && (
            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0 rounded-lg hover:bg-purple/10 dark:hover:bg-purple/20 text-muted-foreground hover:text-purple"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FlashcardItem;
