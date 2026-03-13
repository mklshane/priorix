"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, Target, Clock, BarChart } from "lucide-react";

async function fetchLearningStats(userId: string) {
  const res = await fetch(
    `/api/analytics/user-stats?userId=${userId}&period=7`,
  );
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  const today = data.dailyBreakdown?.find(
    (d: any) => new Date(d.date).toDateString() === new Date().toDateString(),
  );
  return {
    cardsStudiedToday: today?.cardsStudied || 0,
    currentStreak: data.currentStreak || 0,
    overallAccuracy: data.averageAccuracy || 0,
    totalReviews: data.totalReviews || 0,
  };
}

export default function LearningStatsWidget() {
  const { data: session } = useSession();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["learning-stats", session?.user?.id],
    queryFn: () => fetchLearningStats(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card h-28 animate-pulse bg-muted/50" />
        <div className="bento-card h-28 animate-pulse bg-muted/50" />
        <div className="bento-card h-28 animate-pulse bg-muted/50" />
        <div className="bento-card h-28 animate-pulse bg-muted/50" />
      </div>
    );
  }

  const statItems = [
    {
      label: "Studied Today",
      value: stats.cardsStudiedToday,
      icon: Target,
      bgColor: "bg-sky",
    },
    {
      label: "Current Streak",
      value: `${stats.currentStreak}d`,
      icon: TrendingUp,
      bgColor: "bg-mint",
    },
    {
      label: "Accuracy",
      value: `${stats.overallAccuracy.toFixed(1)}%`,
      icon: BarChart,
      bgColor: "bg-lilac",
    },
    {
      label: "Total Reviews",
      value: stats.totalReviews,
      icon: Clock,
      bgColor: "bg-tangerine",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 font-sans">
      {statItems.map((item) => (
        <div
          key={item.label}
          className={`bento-card ${item.bgColor} p-5 flex flex-col justify-between min-h-[120px] hover:-translate-y-1 transition-transform`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm">
              <item.icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/80 leading-tight">
              {item.label}
            </span>
          </div>
          <div className="text-4xl font-editorial mt-2">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
