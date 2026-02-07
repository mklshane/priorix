"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Clock,
  BarChart
} from "lucide-react";
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
  const res = await fetch(`/api/analytics/user-stats?userId=${userId}&period=7`);
  if (!res.ok) throw new Error("Failed to fetch learning stats");
  const data = await res.json();
  
  // Get today's study count
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
    staleTime: 30_000, // 30 seconds
  });

  if (isLoading || !stats) {
    return (
      <Card className="border-2 border-black dark:border-darkborder">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-sora flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Learning Progress
            </h3>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      label: "Studied Today",
      value: stats.cardsStudiedToday,
      icon: Target,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Current Streak",
      value: `${stats.currentStreak} days`,
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Accuracy",
      value: `${stats.overallAccuracy.toFixed(1)}%`,
      icon: BarChart,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Total Reviews",
      value: stats.totalReviews,
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  return (
    <Card className="border-2 border-black dark:border-darkborder">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-sora flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Learning Progress
          </h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/analytics")}
            className="text-xs"
          >
            View Details
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`rounded-lg p-4 ${item.bgColor} border border-border/50`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-xs text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${item.color}`}>
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
