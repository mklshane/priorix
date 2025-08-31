"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Make sure you have this utility for className merging

interface DeckCardProps {
  id: number;
  title: string;
  totalCards: number;
  studied: number;
  lastStudied: string;
  color: string;
  textColor?: string;
  course?: string;
  className?: string;
  onStudyClick?: (id: number) => void;
}

const DeckCard = ({
  id,
  title,
  totalCards,
  studied,
  lastStudied,
  color,
  textColor = "text-foreground",
  course,
  className,
  onStudyClick,
}: DeckCardProps) => {
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
          {course && (
            <p className={cn("text-sm font-light", textColor)}>{course}</p>
          )}
        </div>

        {/* Stats and action */}
        <div className="mt-auto">
          <div className="flex justify-between items-center text-sm mb-3">
            <span className={cn("font-semibold font-sora", textColor)}>
              {studied}/{totalCards} cards
            </span>
            <div className={cn("flex items-center", textColor)}>
              <Clock className="h-3 w-3 mr-1" />
              {lastStudied}
            </div>
          </div>

          <Button
            className={cn(
              "w-full bg-primary-foreground hover:bg-gray-100 text-primary  border border-primary",
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
};

export default DeckCard;
