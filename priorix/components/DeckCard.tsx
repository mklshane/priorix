"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Deck } from "@/types/deck";

// Props for RecentDecks usage (existing format)
interface RecentDeckProps {
  id: number;
  title: string;
  totalCards: number;
  lastStudied: string;
  color: string;
  textColor?: string;
  className?: string;
  onStudyClick?: (id: number) => void;
  onClick?: never; // Prevent onClick when using RecentDecks format
}

// Props for DecksPage usage (new Deck format)
interface DeckPageProps {
  deck: Deck & {
    totalCards?: number; // Optional additional field for card count
    lastStudied?: string; // Optional additional field for last studied
  };
  className?: string;
  onClick?: (deckId: string) => void;
  onStudyClick?: never; // Prevent onStudyClick when using Deck format
  id?: never;
  totalCards?: never;
  lastStudied?: never;
  color?: never;
  textColor?: never;
  index?: number; // Index for color cycling
}

type DeckCardProps = RecentDeckProps | DeckPageProps;

// Type guard to check if props are for RecentDecks
const isRecentDeckProps = (props: DeckCardProps): props is RecentDeckProps => {
  return "id" in props && typeof props.id === "number";
};

// Available colors for cycling in DecksPage
const colors = ["bg-pink", "bg-green", "bg-yellow", "bg-purple"];

const DeckCard = (props: DeckCardProps) => {
  if (isRecentDeckProps(props)) {
    // RecentDecks format - maintain existing look
    const {
      id,
      title,
      totalCards,
      lastStudied,
      color,
      textColor = "text-foreground",
      className,
      onStudyClick,
    } = props;

    const handleStudyClick = () => {
      if (onStudyClick) {
        onStudyClick(id);
      }
    };

    return (
      <Card
        className={cn(
          `border-0 overflow-hidden ${color} shadow-md border-2 border-primary`,
          className
        )}
      >
        <CardContent className="py-3 px-7 flex flex-col h-full">
          {/* Icon and title */}
          <div className="mb-10 flex-grow">
            <div className="flex items-center mb-2">
              <h3
                className={cn(
                  "text-lg font-semibold font-sora line-clamp-2",
                  textColor
                )}
              >
                {title}
              </h3>
            </div>
          </div>

          {/* Stats and action */}
          <div className="mt-auto">
            <div className="flex justify-between items-center text-sm mb-3">
              <span className={cn("font-semibold font-sora", textColor)}>
                {totalCards} cards
              </span>
              <div className={cn("flex items-center", textColor)}>
                <Clock className="h-3 w-3 mr-1" />
                {lastStudied}
              </div>
            </div>

            <Button
              className={cn(
                "w-full bg-primary-foreground hover:bg-gray-100 text-primary border border-primary",
                textColor
              )}
              onClick={handleStudyClick}
            >
              Study Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  } else {
    // DecksPage format - updated to match RecentDecks styling with frontend-assigned colors
    const { deck, className, onClick, index = 0 } = props;

    // Skip rendering if deck is undefined
    if (!deck) {
      console.warn("Deck is undefined, skipping render");
      return null;
    }

    const handleCardClick = () => {
      if (onClick && deck._id) {
        onClick(deck._id);
      }
    };

    // Calculate days since creation for "recent use"
    const getRecentUse = () => {
      if (deck.lastStudied) return deck.lastStudied;
      if (deck.createdAt) {
        const now = new Date();
        const created = new Date(deck.createdAt);
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays}d ago`;
      }
      return "Never";
    };

    // Use index for color cycling to ensure variety
    const colorIndex = index % colors.length;
    const deckColor = colors[colorIndex];
    console.log(`Deck: ${deck.title}, Index: ${index}, Color: ${deckColor}`); // Debug log

    return (
      <Card
        className={cn(
          `border-0 overflow-hidden ${deckColor} shadow-md border-2 border-primary cursor-pointer transition-colors hover:shadow-lg`,
          className
        )}
        onClick={handleCardClick}
      >
        <CardContent className="py-3 px-7 flex flex-col h-full">
          {/* Icon and title */}
          <div className="mb-10 flex-grow">
            <div className="flex items-center mb-2">
              <h3
                className={cn(
                  "text-lg font-semibold font-sora line-clamp-2",
                  "text-foreground"
                )}
              >
                {deck.title}
              </h3>
            </div>
            {deck.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {deck.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="mt-auto">
            <div className="flex justify-between items-center text-sm mb-3">
              <span
                className={cn("font-semibold font-sora", "text-foreground")}
              >
                {deck.totalCards || 0} cards
              </span>
              <div className={cn("flex items-center", "text-foreground")}>
                <Clock className="h-3 w-3 mr-1" />
                {getRecentUse()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default DeckCard;
