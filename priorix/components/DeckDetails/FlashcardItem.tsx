// components/DeckDetails/FlashcardItem.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { IFlashcard } from "@/types/flashcard";
import { useDeckContext } from "@/contexts/DeckContext";

interface FlashcardItemProps {
  flashcard: IFlashcard;
  onEdit?: (flashcard: IFlashcard) => void; // Make optional
  onDelete?: (id: string) => void; // Make optional
  
}

const FlashcardItem = ({
  flashcard,
  onEdit,
  onDelete,

}: FlashcardItemProps) => {

  const { isOwner } = useDeckContext();

  const renderText = (text: string) => {
    return text.split("\n").map((line, index) => (
      <p key={index} className="text-sm break-words my-1">
        {line}
      </p>
    ));
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(flashcard);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(flashcard._id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow bg-purple/15 border-2 border-primary dark:border-darkborder">
      <CardContent className="py-2 md:py-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-center">
          {/* Term Section */}
          <div className="md:border-r md:border-gray-200 md:pr-4">
            <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-1 md:mb-2">
              Term
            </h4>
            {renderText(flashcard.term)}
          </div>

          {/* Definition Section */}
          <div className="md:border-r md:border-gray-200 md:pr-4">
            <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-1 md:mb-2">
              Definition
            </h4>
            {renderText(flashcard.definition)}
          </div>

          {/* Action Buttons - Only show if user is owner and functions are provided */}
          {isOwner && onEdit && onDelete && (
            <div className="flex justify-start md:justify-end gap-2 pt-3 md:pt-0 border-t border-gray-100 md:border-t-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="h-8 px-2 md:px-3 text-xs md:text-sm"
              >
                <Edit className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                <span className="hidden md:inline">Edit</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="h-8 px-2 md:px-3 text-xs md:text-sm bg-red-700"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                <span className="hidden md:inline">Delete</span>
              </Button>
            </div>
          )}

          {/* If not owner, add empty div to maintain grid layout */}
          {!isOwner && <div className="hidden md:block"></div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default FlashcardItem;
