"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Deck } from "@/types/deck";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Props for RecentDecks usage (existing format)
interface RecentDeckProps {
  id: string;
  title: string;
  totalCards: number;
  lastStudied: string;
  color: string;
  textColor?: string;
  className?: string;
  onStudyClick?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
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
  onDeleteClick?: (deckId: string) => void;
  onStudyClick?: never; // Prevent onStudyClick when using Deck format
  id?: never;
  totalCards?: never;
  lastStudied?: never;
  color?: never;
  index?: number;
}

type DeckCardProps = RecentDeckProps | DeckPageProps;

const isRecentDeckProps = (props: DeckCardProps): props is RecentDeckProps => {
  return "id" in props && typeof props.id === "string";
};

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
      onDeleteClick,
    } = props;

    const handleStudyClick = () => {
      if (onStudyClick) {
        onStudyClick(id);
      }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering card click
      if (onDeleteClick) {
        onDeleteClick(id);
      }
    };

    const handleDeckClick = (deckId: string) => {
      console.log(`Opening deck ${deckId}`)
    }

    return (
      <Card
        className={cn(
          `border-0 overflow-hidden ${color} shadow-md border-2 border-primary`,
          className
        )}
        onClick={() => handleDeckClick(id)}
      
      >
        <CardContent className="py-3 px-7 flex flex-col h-full">
          {/* Header with menu */}
          <div className="flex justify-between items-start mb-2">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mt-1 -mr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mb-10 flex-grow">{/* Content area */}</div>

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
    const { deck, className, onClick, onDeleteClick, index = 0 } = props;

    if (!deck) {
      console.warn("Deck is undefined, skipping render");
      return null;
    }

    const handleDeckClick = (deckId: string) => {
      console.log(`Opening deck ${deckId}`);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering card click
      if (onDeleteClick && deck._id) {
        onDeleteClick(deck._id);
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

    return (
      <Card
        className={cn(
          `border-0 overflow-hidden ${deckColor} shadow-md border-2 border-primary cursor-pointer transition-colors hover:shadow-lg`,
          className
        )}
        onClick={() => {handleDeckClick(deck._id)}}
      >
        <CardContent className="py-3 px-7 flex flex-col h-full">
          {/* Header with menu */}
          <div className="flex justify-between items-start mb-2">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mt-1 -mr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mb-10 flex-grow">
            {deck.description && (
              <p className="text-sm text-foreground line-clamp-2">
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
