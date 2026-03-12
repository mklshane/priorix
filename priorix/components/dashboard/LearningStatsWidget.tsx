"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, Target, Clock, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface LearningStats {
  cardsStudiedToday: number;
  currentStreak: number;
  overallAccuracy: number;
  dueToday: number;
  totalReviews: number;
}

async function fetchLearningStats(userId: string): Promise<LearningStats> {
  const res = await fetch(
    `/api/analytics/user-stats?userId=${userId}&period=7`,
  );
  if (!res.ok) throw new Error("Failed to fetch learning stats");
  const data = await res.json();

  const today = data.dailyBreakdown?.find((d: any) => {
    const date = new Date(d.date);
    const todayDate = new Date();
    return date.toDateString() === todayDate.toDateString();
  });

  return {
    cardsStudiedToday: today?.cardsStudied || 0,
    currentStreak: data.currentStreak || 0,
    overallAccuracy: data.averageAccuracy || 0,
    dueToday: today?.cardsStudied || 0,
    totalReviews: data.totalReviews || 0,
  };
}

export default function LearningStatsWidget() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["learning-stats", session?.user?.id],
    queryFn: () => fetchLearningStats(session!.user!.id),
    enabled: !!session?.user?.id,
    staleTime: 30_000,
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bento-card h-28 animate-pulse bg-muted/50 p-4"
          />
        ))}
      </div>
    );
  }

  // Mapped to our Playful Academic Palette
  const statItems = [
    {
      label: "Studied Today",
      value: stats.cardsStudiedToday,
      icon: Target,
      bgColor: "bg-sky",
      textColor: "text-foreground",
    },
    {
      label: "Current Streak",
      value: `${stats.currentStreak} days`,
      icon: TrendingUp,
      bgColor: "bg-mint",
      textColor: "text-foreground",
    },
    {
      label: "Accuracy",
      value: `${stats.overallAccuracy.toFixed(1)}%`,
      icon: BarChart,
      bgColor: "bg-lilac",
      textColor: "text-foreground",
    },
    {
      label: "Total Reviews",
      value: stats.totalReviews,
      icon: Clock,
      bgColor: "bg-tangerine",
      textColor: "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`bento-card ${item.bgColor} p-5 flex flex-col justify-between min-h-[120px] hover:-translate-y-1 transition-transform cursor-default`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm">
                <Icon className={`h-4 w-4 ${item.textColor}`} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/80 leading-tight">
                {item.label}
              </span>
            </div>
            <div className={`text-4xl font-editorial mt-2 ${item.textColor}`}>
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
