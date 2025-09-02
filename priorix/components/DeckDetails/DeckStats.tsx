import { BookOpen, Calendar, User } from "lucide-react";

interface DeckStatsProps {
  flashcardCount: number;
  createdAt: string;
  isPublic: boolean;
}

const DeckStats = ({ flashcardCount, createdAt, isPublic }: DeckStatsProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-primary">
      <div className="flex items-center gap-1">
        <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
        <span>{flashcardCount} cards</span>
      </div>
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3 md:h-4 md:w-4" />
        <span>Created {formatDate(createdAt)}</span>
      </div>
      {isPublic && (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 md:h-4 md:w-4" />
          <span>Public</span>
        </div>
      )}
    </div>
  );
};

export default DeckStats;
