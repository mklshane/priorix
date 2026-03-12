"use client";

import { Clock, Target, Flame, BookOpen } from "lucide-react";

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

export default function OverviewStats({
  stats,
  layout = "grid",
}: OverviewStatsProps) {
  const colors = ["bg-citrus", "bg-mint", "bg-lilac", "bg-blush"];

  const statCards = [
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Studied Today",
      value: stats.totalCardsStudied.toLocaleString(),
      subtitle: `${stats.totalCards} total cards`,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Time Today",
      value: `${Math.floor(stats.totalStudyTime / 60)}h ${stats.totalStudyTime % 60}m`,
      subtitle: `${stats.sessionsCompleted} sessions total`,
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: "Accuracy",
      value: `${stats.averageAccuracy}%`,
      subtitle: `${stats.averageRetention}% retention`,
    },
    {
      icon: <Flame className="h-5 w-5" />,
      label: "Streak",
      value: `${stats.currentStreak} days`,
      subtitle: `Best: ${stats.longestStreak} days`,
    },
  ];

  const gridClass = {
    grid: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
    vertical: "flex flex-col gap-4",
    horizontal: "flex overflow-x-auto gap-4 pb-2",
    compact: "grid grid-cols-2 gap-4 h-full",
  }[layout];

  return (
    <div className={`grid ${gridClass} font-sans`}>
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`bento-card ${colors[index % colors.length]} p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform group`}
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none pt-1">
              {stat.label}
            </span>
            <div className="w-8 h-8 rounded-lg bg-background border-2 border-border flex items-center justify-center group-hover:rotate-12 transition-transform">
              {stat.icon}
            </div>
          </div>
          <div>
            <p className="text-3xl font-editorial leading-none mb-1">
              {stat.value}
            </p>
            <p className="text-[10px] font-bold uppercase opacity-60 tracking-tighter">
              {stat.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
