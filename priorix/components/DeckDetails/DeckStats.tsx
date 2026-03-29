import { Calendar, Layers, Globe, Lock } from "lucide-react";

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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
      {/* Cards Stat */}
      <div className="bento-card bg-mint p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
            Cards
          </span>
        </div>
        <div className="text-4xl font-editorial text-foreground">
          {flashcardCount}
        </div>
      </div>

      {/* Created At Stat */}
      <div className="bento-card bg-lilac p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm">
            <Calendar className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
            Created
          </span>
        </div>
        <div className="text-2xl font-editorial mt-2 text-foreground">
          {formatDate(createdAt)}
        </div>
      </div>

      {/* Visibility Stat */}
      <div className="bento-card bg-blush p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm">
            {isPublic ? (
              <Globe className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
            Visibility
          </span>
        </div>
        <div className="text-2xl font-editorial mt-2 text-foreground capitalize">
          {isPublic ? "Public" : "Private"}
        </div>
      </div>
    </div>
  );
};

export default DeckStats;