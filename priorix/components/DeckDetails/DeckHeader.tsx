import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Deck } from "@/types/deck";
import { IFlashcard } from "@/types/flashcard";
import DeckStats from "./DeckStats";
import { User } from "lucide-react";
import { useDeckContext } from "@/contexts/DeckContext";

interface DeckHeaderProps {
  deck: Deck;
  flashcards: IFlashcard[];
  onStudyDeck: () => void;
  onImportPDF?: () => void;
}

const DeckHeader = ({
  deck,
  flashcards,
  onStudyDeck,
  onImportPDF,
}: DeckHeaderProps) => {
  const { isOwner } = useDeckContext();

  // Function to get the user's display name
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
    <div className="mb-6 md:mb-8">
      <Card className="border-2 border-primary bg-yellow noise">
        <CardContent className="py-4 md:py-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1">
              {/* Deck Title */}
              <CardTitle className="text-xl md:text-2xl font-bold mb-2">
                {deck.title}
              </CardTitle>

              {/* Creator Name */}
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <User className="h-4 w-4" />
                <span className="text-sm md:text-base">
                  Created by {getDisplayName()}
                  {!isOwner && " • Shared with you"}
                </span>
              </div>

              {/* Deck Description */}
              {deck.description && (
                <p className="text-muted-foreground mb-3 md:mb-4 text-sm md:text-base">
                  {deck.description}
                </p>
              )}

              <DeckStats
                flashcardCount={flashcards.length}
                createdAt={deck.createdAt}
                isPublic={deck.isPublic}
              />
            </div>

            <div className="flex flex-row gap-2 md:ml-4 md:items-end">
              {isOwner && onImportPDF && (
                <Button
                  size="sm"
                  onClick={onImportPDF}
                  className="flex items-center gap-1 md:gap-2 bg-green text-primary border-2 border-primary hover:bg-green/70 text-xs md:text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    ></path>
                  </svg>
                  <span className="hidden sm:inline">Magic</span> Import
                </Button>
              )}

              {flashcards.length > 0 && (
                <Button
                  size="sm"
                  onClick={onStudyDeck}
                  className="flex items-center gap-1 md:gap-2 bg-pink text-primary border-2 border-primary hover:bg-pink/70 text-xs md:text-sm"
                >
                  Study Now
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeckHeader;
