import { Calendar, Layers, Globe, Lock, Target } from "lucide-react";

interface DeckStatsProps {
  flashcardCount: number;
  createdAt: string;
  isPublic: boolean;
  srsRecallRate?: number;
  srsAverageAccuracy?: number;
  srsSessions?: number;
}

const DeckStats = ({ flashcardCount, createdAt, isPublic, srsRecallRate, srsAverageAccuracy, srsSessions }: DeckStatsProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const showSRS = typeof srsSessions === "number" && srsSessions > 0;

  return (
    <div className={`grid grid-cols-2 gap-4 mt-8 ${showSRS ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
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
      {showSRS && (
        <div className="bento-card bg-citrus p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm">
              <Target className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
              SRS Recall Rate
            </span>
          </div>
          <div className="text-4xl font-editorial text-foreground">
            {srsRecallRate ?? srsAverageAccuracy}%
          </div>
          <div className="text-xs text-foreground/60 mt-1">
            {srsSessions} session{srsSessions !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckStats;