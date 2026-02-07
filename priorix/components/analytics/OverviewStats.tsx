import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, Target, Flame, BookOpen, CheckCircle } from "lucide-react";

interface OverviewStatsProps {
  stats: {
    totalCardsStudied: number;
    totalStudyTime: number;
    averageAccuracy: number;
    averageRetention: number;
    currentStreak: number;
    longestStreak: number;
    totalCards: number;
    sessionsCompleted: number;
  };
  layout?: "grid" | "vertical" | "horizontal" | "compact";
}

export default function OverviewStats({ stats, layout = "grid" }: OverviewStatsProps) {
  const colors = ["bg-yellow/30 dark:bg-yellow/10", "bg-green/30 dark:bg-green/10", "bg-purple/30 dark:bg-purple/10", "bg-pink/30 dark:bg-pink/10"];
  
  const statCards = [
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Cards Studied",
      value: stats.totalCardsStudied.toLocaleString(),
      subtitle: `${stats.totalCards} total cards`,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Study Time",
      value: `${Math.floor(stats.totalStudyTime / 60)}h ${stats.totalStudyTime % 60}m`,
      subtitle: `${stats.sessionsCompleted} sessions`,
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: "Accuracy",
      value: `${stats.averageAccuracy}%`,
      subtitle: `${stats.averageRetention}% retention`,
    },
    {
      icon: <Flame className="h-5 w-5" />,
      label: "Current Streak",
      value: `${stats.currentStreak} days`,
      subtitle: `Best: ${stats.longestStreak} days`,
    },
  ];

  const containerClass = 
    layout === "vertical" 
      ? "flex flex-col gap-3 h-full" 
      : layout === "horizontal"
      ? "flex overflow-x-auto gap-2 pb-2"
      : layout === "compact"
      ? "grid grid-cols-2 gap-2 h-full"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4";

  const cardClass = 
    layout === "horizontal"
      ? "min-w-[140px] flex-shrink-0"
      : layout === "vertical"
      ? "flex-1"
      : layout === "compact"
      ? ""
      : "";

  return (
    <div className={containerClass}>
      {statCards.map((stat, index) => (
        <Card key={index} className={`border-2 border-black dark:border-darkborder rounded-xl ${colors[index % colors.length]} hover:shadow-md transition-shadow ${cardClass}`}>
          <CardContent className={layout === "horizontal" ? "p-3" : layout === "vertical" ? "p-4 h-full flex flex-col justify-between" : layout === "compact" ? "p-3 sm:p-4" : "p-6"}>
            <div className="flex items-center justify-between mb-2">
              <span className={`${layout === "horizontal" || layout === "compact" ? "text-xs" : "text-sm"} font-medium text-muted-foreground font-sora`}>
                {stat.label}
              </span>
              <div className={layout === "horizontal" || layout === "compact" ? "scale-75" : ""}>
                {stat.icon}
              </div>
            </div>
            <div className="space-y-1">
              <p className={`${layout === "horizontal" || layout === "compact" ? "text-base sm:text-lg" : "text-2xl"} font-bold font-sora`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
