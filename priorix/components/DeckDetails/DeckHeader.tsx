import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Deck } from "@/types/deck";
import { IFlashcard } from "@/types/flashcard";
import DeckStats from "./DeckStats";
import { User, Sparkles, BookOpen, Share2, Globe, Lock } from "lucide-react";
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
    <div className="mb-6 md:mb-8">
      <Card className="relative overflow-hidden border-2 border-primary bg-yellow dark:bg-card2 dark:border-darkborder">
        {/* Decorative accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink via-purple to-perry" />

        <CardContent className="pt-5 pb-4 md:pt-6 md:pb-5">
          <div className="flex flex-col gap-4">
            {/* Top row: Title + Badges */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                    {deck.title}
                  </h1>
                  <Badge
                    variant="outline"
                    className="shrink-0 gap-1 text-[10px] font-semibold uppercase tracking-wider border-primary/30 dark:border-darkborder"
                  >
                    {deck.isPublic ? (
                      <><Globe className="h-3 w-3" /> Public</>
                    ) : (
                      <><Lock className="h-3 w-3" /> Private</>
                    )}
                  </Badge>
                  {!isOwner && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 gap-1 text-[10px] font-semibold uppercase tracking-wider"
                    >
                      <Share2 className="h-3 w-3" /> Shared
                    </Badge>
                  )}
                </div>

                {/* Creator */}
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple/20 dark:bg-purple/30">
                    <User className="h-3.5 w-3.5 text-purple" />
                  </div>
                  <span className="text-sm font-medium">
                    {getDisplayName()}
                  </span>
                </div>

                {/* Description */}
                {deck.description && (
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
                    {deck.description}
                  </p>
                )}

                <DeckStats
                  flashcardCount={flashcards.length}
                  createdAt={deck.createdAt}
                  isPublic={deck.isPublic}
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-row gap-2 md:flex-col md:items-stretch shrink-0">
                {flashcards.length > 0 && (
                  <Button
                    onClick={onStudyClick}
                    className="flex items-center gap-2 bg-pink text-primary border-2 border-primary hover:bg-pink/80 hover:-translate-y-0.5 transition-all duration-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 dark:text-yellow font-bold text-sm md:text-base dark:shadow-[3px_3px_0px_0px_rgba(75,0,130,0.6)]"
                  >
                    <BookOpen className="h-4 w-4" />
                    Study Now
                  </Button>
                )}
                {isOwner && onImportPDF && (
                  <Button
                    variant="outline"
                    onClick={onImportPDF}
                    className="flex items-center gap-2 bg-green text-primary border-2 border-primary hover:bg-green/80 hover:-translate-y-0.5 transition-all duration-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 font-bold text-sm dark:text-white dark:shadow-[3px_3px_0px_0px_rgba(75,0,130,0.6)]"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">Magic</span> Import
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeckHeader;
