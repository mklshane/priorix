"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Flame, Target, Award, BookOpen, Zap } from "lucide-react";
import RecentDecks from "@/components/dashboard/RecentDeck";
import TodoList from "@/components/dashboard/TodoList";
import QuickActions from "@/components/dashboard/QuickActions";
import Calendar from "@/components/dashboard/Calendar";
import { HeatmapCalendar, OverviewStats, InsightsPanel } from "@/components/analytics";
import AddDeckModal from "@/components/Deck/AddDeckModal";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CreateDeckRequest } from "@/types/deck";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [isAddDeckModalOpen, setIsAddDeckModalOpen] = useState(false);
  const { showToast, dismissToast } = useToast();

  // Fetch daily stats for heatmap and overview stats
  const { data: userStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["user-stats", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/user-stats?userId=${session?.user?.id}&period=60`
      );
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch learning patterns for insights
  const { data: patterns } = useQuery({
    queryKey: ["learning-patterns", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/learning-patterns?userId=${session?.user?.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch patterns");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Generate dynamic greeting based on user activity
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getInsightMessage = () => {
    if (!userStats?.overview) {
      return {
        message: "Welcome! 👋",
        subtext: "Create your first deck and start mastering new concepts.",
        icon: BookOpen,
        bgColor: "bg-pink/30 dark:bg-pink/20"
      };
    }

    const {
      totalCardsStudied, // today's cards
      totalStudyTime,    // today's minutes
      currentStreak,
      longestStreak,
      averageAccuracy,
      averageRetention,
      totalCards,
      sessionsCompleted,
    } = userStats.overview;

    const mastered = userStats?.masteryDistribution?.mastered ?? 0;
    const trend = patterns?.performanceTrend;
    const optimalHours: number[] = patterns?.optimalStudyTimes ?? [];
    const currentHour = new Date().getHours();

    // --- Priority 1: Epic streak (30+ days) ---
    if (currentStreak >= 30) {
      return {
        message: `${currentStreak}-day streak! 🏆`,
        subtext: "You've built an unbreakable habit. Legendary consistency!",
        icon: Flame,
        bgColor: "bg-yellow/30 dark:bg-yellow/20"
      };
    }

    // --- Priority 2: New personal best streak (5+) ---
    if (currentStreak === longestStreak && currentStreak >= 5) {
      return {
        message: "New personal best! 🏅",
        subtext: `Your longest streak ever: ${currentStreak} days! History in the making.`,
        icon: Flame,
        bgColor: "bg-yellow/30 dark:bg-yellow/20"
      };
    }

    // --- Priority 3: Mastery milestone (100+ cards mastered) ---
    if (mastered >= 100) {
      return {
        message: `${mastered} cards mastered! 🎯`,
        subtext: "Your long-term memory is stacked. True expertise is forming.",
        icon: Award,
        bgColor: "bg-green/30 dark:bg-green/20"
      };
    }

    // --- Priority 4: Mastery milestone (25+ cards mastered) ---
    if (mastered >= 25) {
      return {
        message: `${mastered} cards mastered 💎`,
        subtext: "These are locked in your long-term memory. Real progress!",
        icon: Award,
        bgColor: "bg-green/30 dark:bg-green/20"
      };
    }

    // --- Priority 5: Accuracy trending up ---
    if (trend?.trend === "improving" && trend.change > 0) {
      return {
        message: "Accuracy trending up! 📈",
        subtext: `Your accuracy improved by ${Math.abs(trend.change)}% recently. Your brain is adapting!`,
        icon: TrendingUp,
        bgColor: "bg-violet/30 dark:bg-violet/20"
      };
    }

    // --- Priority 6: Optimal study time match ---
    if (optimalHours.length > 0 && optimalHours.includes(currentHour)) {
      return {
        message: "Peak brain hour! ⚡",
        subtext: "You perform best at this time of day. Make the most of it!",
        icon: Zap,
        bgColor: "bg-yellow/30 dark:bg-yellow/20"
      };
    }

    // --- Priority 7: Big day today (50+ cards) ---
    if (totalCardsStudied >= 50) {
      return {
        message: `${totalCardsStudied} cards today! 🚀`,
        subtext: "You're on fire today! An impressive study session.",
        icon: TrendingUp,
        bgColor: "bg-violet/30 dark:bg-violet/20"
      };
    }

    // --- Priority 8: Strong day (20+ cards) ---
    if (totalCardsStudied >= 20) {
      return {
        message: `${totalCardsStudied} cards down today 💪`,
        subtext: "Solid session so far! Every card strengthens the neural pathways.",
        icon: TrendingUp,
        bgColor: "bg-violet/30 dark:bg-violet/20"
      };
    }

    // --- Priority 9: Near-perfect accuracy today ---
    if (averageAccuracy >= 95 && totalCardsStudied >= 5) {
      return {
        message: "Near-perfect recall! ⭐",
        subtext: "Your retention is outstanding. The spaced repetition is working.",
        icon: Award,
        bgColor: "bg-green/30 dark:bg-green/20"
      };
    }

    // --- Priority 10: High accuracy today ---
    if (averageAccuracy >= 85 && totalCardsStudied >= 5) {
      return {
        message: `${Math.round(averageAccuracy)}% accuracy 🎯`,
        subtext: "Strong recall across your cards. Your study method is paying off.",
        icon: Target,
        bgColor: "bg-green/30 dark:bg-green/20"
      };
    }

    // --- Priority 11: Long streak (7-29 days) ---
    if (currentStreak >= 7) {
      return {
        message: `${currentStreak}-day streak 🔥`,
        subtext: "A full week of consistency! Knowledge compounds with every day.",
        icon: Flame,
        bgColor: "bg-yellow/30 dark:bg-yellow/20"
      };
    }

    // --- Priority 12: Declining trend (gentle nudge) ---
    if (trend?.trend === "declining") {
      return {
        message: "Time to refocus 🎯",
        subtext: "Your accuracy dipped recently. A focused session today can turn it around!",
        icon: Target,
        bgColor: "bg-pink/30 dark:bg-pink/20"
      };
    }

    // --- Priority 13: Building habit (3+ day streak) ---
    if (currentStreak >= 3) {
      return {
        message: `${currentStreak} days strong! 💫`,
        subtext: "The hardest part is behind you. You're building a real habit!",
        icon: Zap,
        bgColor: "bg-yellow/30 dark:bg-yellow/20"
      };
    }

    // --- Priority 14: Active today ---
    if (totalCardsStudied > 0) {
      return {
        message: "Nice start today! ✨",
        subtext: `${totalCardsStudied} card${totalCardsStudied !== 1 ? "s" : ""} studied so far. Keep the momentum going!`,
        icon: Zap,
        bgColor: "bg-yellow/30 dark:bg-yellow/20"
      };
    }

    // --- Priority 15: Has cards but hasn't studied today ---
    if (totalCards > 0) {
      return {
        message: "Ready to learn 📚",
        subtext: "Your cards are waiting. Even a quick 5-minute session makes a difference!",
        icon: BookOpen,
        bgColor: "bg-green/30 dark:bg-green/20"
      };
    }

    // --- Priority 16: Brand new user fallback ---
    return {
      message: "Welcome! 👋",
      subtext: "Create your first deck and start mastering new concepts.",
      icon: BookOpen,
      bgColor: "bg-pink/30 dark:bg-pink/20"
    };
  };

  const insight = getInsightMessage();
  const InsightIcon = insight.icon;

  const handleAddDeck = async (newDeckData: CreateDeckRequest) => {
    showToast("Creating deck...", "loading");

    try {
      const res = await fetch("/api/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDeckData,
          userId: session?.user?.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to create deck");

      const created = await res.json();

      dismissToast();
      showToast("Deck created successfully!", "success");

      setIsAddDeckModalOpen(false);
      if (created?._id) {
        router.push(`/decks/${created._id}`);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Error creating deck:", err);
      dismissToast();
      showToast("Failed to create deck", "error");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        {isStatsLoading ? (
          <Card className="border-2 border-black dark:border-darkborder rounded-xl bg-muted/30">
            <CardContent className="py-5 px-5 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-5 bg-muted animate-pulse rounded w-full" />
                </div>
                <div className="hidden sm:block">
                  <div className="h-12 w-32 bg-muted animate-pulse rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className={`border-2 border-black dark:border-darkborder rounded-xl ${insight.bgColor}`}>
            <CardContent className="py-5 px-5 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold font-sora text-foreground mb-2">
                    {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
                  </h1>
                  <p className="text-sm sm:text-base text-foreground/80 font-sora">
                    {insight.subtext}
                  </p>
                </div>
                
                {/* Stats badge */}
                <div className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border-2 border-black dark:border-darkborder">
                  <InsightIcon className="h-6 w-6 text-foreground" />
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {insight.message.replace(/🔥|👋/g, '').trim()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Decks Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-sora text-foreground">
            Recent Decks
          </h2>
          <Button
            variant="ghost"
            className="text-primary"
            onClick={() => {
              router.push("/decks");
            }}
          >
            View All <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <RecentDecks />
      </div>

      {/* Study Activity Heatmap */}
      {userStats?.dailyStats && userStats.dailyStats.length > 0 && (
        <div className="mb-8">
          {/* Desktop and Mobile: Heatmap with 2x2 stats grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 min-w-0">
              <HeatmapCalendar dailyStats={userStats.dailyStats} />
            </div>
            {/* Desktop and Mobile: 2x2 Overview Stats grid */}
            <div className="h-full">
              {userStats?.overview && (
                <OverviewStats stats={userStats.overview} layout="compact" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Learning Insights */}
      {patterns && (
        <div className="mb-8">
          {patterns?.requiresMoreSessions ? (
            <div className="max-w-4xl">
              <Card className="bg-purple/20 dark:bg-card border-2 border-black dark:border-darkborder rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <h3 className="text-lg font-semibold font-sora">
                      Unlock Insights
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Complete at least {patterns.minimumRequired} study sessions to get personalized learning insights.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm font-medium">
                      <span className="text-primary font-semibold">
                        {patterns.currentSessions} / {patterns.minimumRequired}
                      </span>
                      <span className="text-muted-foreground">sessions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : patterns?.insights ? (
            <InsightsPanel insights={patterns.insights} />
          ) : (
            <div className="max-w-4xl">
              <Card className="bg-pink/20 dark:bg-card border-2 border-black dark:border-darkborder rounded-xl">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground font-sora">Start studying to unlock insights</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      <AddDeckModal
        open={isAddDeckModalOpen}
        onOpenChange={setIsAddDeckModalOpen}
        onAddDeck={handleAddDeck}
        folders={[]}
      />
    </div>
  );
}
