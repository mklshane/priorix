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
  const { data: userStats } = useQuery({
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
        message: "Start learning",
        subtext: "Create your first deck and begin mastering new concepts.",
        icon: BookOpen,
        bgColor: "bg-pink/30 dark:bg-pink/20"
      };
    }

    const { totalCardsStudied, currentStreak, averageAccuracy, longestStreak, totalStudyTime } = userStats.overview;

    // Epic streak achievement (30+ days)
    if (currentStreak >= 30) {
      return {
        message: `${currentStreak}-day streak! 🏆`,
        subtext: "Absolutely incredible dedication! You're building habits that last a lifetime.",
        icon: Flame,
        bgColor: "bg-yellow/30 dark:bg-yellow/20"
      };
    }

    // Perfect accuracy
    if (averageAccuracy === 100 && totalCardsStudied >= 10) {
      return {
        message: "Perfect accuracy! ⭐",
        subtext: "Flawless performance! Your focus and retention are exceptional.",
        icon: Award,
        bgColor: "bg-green/30 dark:bg-green/20"
      };
    }

    // Major milestones
    if (totalCardsStudied >= 1000) {
      return {
        message: `${totalCardsStudied.toLocaleString()} cards mastered! 🎯`,
        subtext: "You're a learning machine! This level of commitment is truly impressive.",
        icon: TrendingUp,
        bgColor: "bg-violet/30 dark:bg-violet/20"
      };
    }

    if (totalCardsStudied >= 500) {
      return {
        message: `${totalCardsStudied} cards studied 💪`,
        subtext: "Half a thousand cards down! You're becoming an expert.",
        icon: TrendingUp,
        bgColor: "bg-violet/30 dark:bg-violet/20"
      };
    }

    if (totalCardsStudied >= 100) {
      return {
        message: `${totalCardsStudied} cards strong! 🚀`,
        subtext: "You've hit triple digits! The compound effect is working.",
        icon: TrendingUp,
        bgColor: "bg-violet/30 dark:bg-violet/20"
      };
    }

    // Long streak (7-29 days)
    if (currentStreak >= 7) {
      return {
        message: `${currentStreak}-day streak 🔥`,
        subtext: "Your consistency is building lasting knowledge. Keep it up!",
        icon: Flame,
        bgColor: "bg-yellow/30 dark:bg-yellow/20"
      };
    }

    // High accuracy
    if (averageAccuracy >= 90 && totalCardsStudied >= 20) {
      return {
        message: `${Math.round(averageAccuracy)}% accuracy 🎯`,
        subtext: "Outstanding retention! Your study techniques are really working.",
        icon: Award,
        bgColor: "bg-green/30 dark:bg-green/20"
      };
    }

    if (averageAccuracy >= 85 && totalCardsStudied >= 20) {
      return {
        message: `${Math.round(averageAccuracy)}% accuracy`,
        subtext: "Your mastery is showing. Time to challenge yourself with new material.",
        icon: Award,
        bgColor: "bg-green/30 dark:bg-green/20"
      };
    }

    // Broke personal record
    if (currentStreak === longestStreak && currentStreak >= 3) {
      return {
        message: "New personal best! 🏅",
        subtext: `You're on your longest streak yet: ${currentStreak} days! Keep pushing.`,
        icon: Flame,
        bgColor: "bg-yellow/30 dark:bg-yellow/20"
      };
    }

    // Good progress (50+ cards)
    if (totalCardsStudied >= 50) {
      return {
        message: `${totalCardsStudied} cards studied`,
        subtext: "You're making great progress. Consistency breeds mastery!",
        icon: TrendingUp,
        bgColor: "bg-violet/30 dark:bg-violet/20"
      };
    }

    // Study time milestone
    if (totalStudyTime >= 300) { // 5+ hours
      return {
        message: `${Math.round(totalStudyTime / 60)}+ hours invested 📚`,
        subtext: "Your dedication is remarkable. Every minute counts toward mastery.",
        icon: BookOpen,
        bgColor: "bg-violet/30 dark:bg-violet/20"
      };
    }

    // Starting journey (3+ days streak)
    if (currentStreak >= 3) {
      return {
        message: "Building habit! 💫",
        subtext: `${currentStreak} days in a row! The hardest part is already behind you.`,
        icon: Zap,
        bgColor: "bg-yellow/30 dark:bg-yellow/20"
      };
    }

    // Getting started
    if (totalCardsStudied > 0) {
      return {
        message: "Building momentum",
        subtext: "Every card you study brings you closer to mastery. Keep going!",
        icon: Zap,
        bgColor: "bg-yellow/30 dark:bg-yellow/20"
      };
    }

    // Default fallback
    return {
      message: "Ready to learn",
      subtext: "Your brain is primed for learning. Let's make today count!",
      icon: Target,
      bgColor: "bg-green/30 dark:bg-green/20"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Learning Insights - 2 columns */}
              <div className="lg:col-span-2">
                <InsightsPanel insights={patterns.insights} />
              </div>
              
              {/* Performance Trend - 1 column */}
              <div>
                {patterns.performanceTrend && (
                  <Card className="bg-green/20 dark:bg-card border-2 border-black dark:border-darkborder rounded-xl h-full">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4 font-sora">
                        Performance Trend
                      </h3>
                      <div className="flex flex-col items-center justify-center space-y-6 h-full">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Recent</p>
                          <p className="text-3xl font-bold">
                            {patterns.performanceTrend.recentAccuracy}%
                          </p>
                        </div>
                        <div className="text-2xl text-muted-foreground">↓</div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Change</p>
                          <p
                            className={`text-3xl font-bold ${
                              patterns.performanceTrend.change > 0
                                ? "text-green-500"
                                : patterns.performanceTrend.change < 0
                                ? "text-red-500"
                                : ""
                            }`}
                          >
                            {patterns.performanceTrend.change > 0 ? "+" : ""}
                            {patterns.performanceTrend.change}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
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
