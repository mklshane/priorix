import { BookOpen, Calendar, Layers } from "lucide-react";

interface DeckStatsProps {
  flashcardCount: number;
  createdAt: string;
  isPublic: boolean;
}

const DeckStats = ({ flashcardCount, createdAt }: DeckStatsProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-purple/15 dark:bg-purple/25 px-3 py-1 text-xs font-semibold text-foreground border border-purple/30 dark:border-purple/40">
        <Layers className="h-3.5 w-3.5 text-purple" />
        <span>{flashcardCount} {flashcardCount === 1 ? "card" : "cards"}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-perry/15 dark:bg-perry/25 px-3 py-1 text-xs font-semibold text-foreground border border-perry/30 dark:border-perry/40">
        <Calendar className="h-3.5 w-3.5 text-perry" />
        <span>{formatDate(createdAt)}</span>
      </div>
    </div>
  );
};

export default DeckStats;
