import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Deck } from "@/types/deck";
import { IFlashcard } from "@/types/flashcard";
import DeckStats from "./DeckStats";

interface DeckHeaderProps {
  deck: Deck;
  flashcards: IFlashcard[];
  onStudyDeck: () => void;
}

const DeckHeader = ({ deck, flashcards, onStudyDeck }: DeckHeaderProps) => {
  return (
    <div className="mb-6 md:mb-8">
      <Card className="border-2 border-primary bg-yellow noise">
        <CardContent className="py-2 md:py-0 ">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl md:text-2xl font-bold mb-2">
                {deck.title}
              </CardTitle>
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

            <div className="flex flex-row gap-2 md:ml-4">
              <Button
                size="sm"
                className="flex items-center gap-1 md:gap-2 bg-green text-primary border-2 border-primary hover:bg-green/70 text-xs md:text-sm"
              >
                <span className="hidden sm:inline">Magic</span> Import
              </Button>

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
