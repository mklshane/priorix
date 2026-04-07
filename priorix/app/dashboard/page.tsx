"use client";

import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingUp,
  Flame,
  Target,
  Award,
  BookOpen,
  Zap,
} from "lucide-react";
import RecentDecks from "@/components/dashboard/RecentDeck";
import QuickActions from "@/components/dashboard/QuickActions";
import TodoList from "@/components/dashboard/TodoList";
import {
  HeatmapCalendar,
  OverviewStats,
  InsightsPanel,
} from "@/components/analytics";
import AddDeckModal from "@/components/Deck/AddDeckModal";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CreateDeckRequest } from "@/types/deck";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DailyGoalWidget from "@/components/dashboard/DailyGoalWidget";
import StudyQueueWidget from "@/components/dashboard/StudyQueueWidget";
import RetentionRiskWidget from "@/components/dashboard/RetentionRiskWidget";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [isAddDeckModalOpen, setIsAddDeckModalOpen] = useState(false);
  const { showToast, dismissToast } = useToast();

  // Fetch daily stats
  const { data: userStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["user-stats", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/user-stats?userId=${session?.user?.id}&period=60`,
      );
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch learning patterns
  const { data: patterns, isLoading: isPatternsLoading } = useQuery({
    queryKey: ["learning-patterns", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/learning-patterns?userId=${session?.user?.id}`,
      );
      if (!res.ok) throw new Error("Failed to fetch patterns");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch due-today data for study queue and retention risk
  const { data: dueTodayData, isLoading: isDueTodayLoading } = useQuery({
    queryKey: ["due-today", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/due-today?userId=${session?.user?.id}`,
      );
      if (!res.ok)
        return {
          totalDue: 0,
          totalAtRisk: 0,
          decks: [],
          atRiskDecks: [],
          queueDecks: [],
        };
      return res.json();
    },
    enabled: !!session?.user?.id,
    staleTime: 60_000,
  });

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
        bgColor: "bg-blush text-foreground",
      };
    }
    const {
      totalCardsStudied,
      totalStudyTime,
      currentStreak,
      longestStreak,
      averageRecallRate,
      averageAccuracy,
      totalCards,
    } = userStats.overview;
    const srsRecallRate = averageRecallRate ?? averageAccuracy ?? 0;
    const mastered = userStats?.masteryDistribution?.mastered ?? 0;
    const trend = patterns?.performanceTrend;
    const optimalHours: number[] = patterns?.optimalStudyTimes ?? [];
    const currentHour = new Date().getHours();

    if (currentStreak >= 30)
      return {
        message: `${currentStreak}-day streak! 🏆`,
        subtext: "You've built an unbreakable habit. Legendary consistency!",
        icon: Flame,
        bgColor: "bg-citrus",
      };
    if (currentStreak === longestStreak && currentStreak >= 5)
      return {
        message: "New personal best! 🏅",
        subtext: `Your longest streak ever: ${currentStreak} days! History in the making.`,
        icon: Flame,
        bgColor: "bg-citrus",
      };
    if (mastered >= 100)
      return {
        message: `${mastered} cards mastered! 🎯`,
        subtext: "Your long-term memory is stacked. True expertise is forming.",
        icon: Award,
        bgColor: "bg-mint",
      };
    if (mastered >= 25)
      return {
        message: `${mastered} cards mastered 💎`,
        subtext: "These are locked in your long-term memory. Real progress!",
        icon: Award,
        bgColor: "bg-mint",
      };
    if (trend?.trend === "improving" && trend.change > 0)
      return {
        message: "Recall rate trending up! 📈",
        subtext: `Your recall rate improved by ${Math.abs(trend.change)}% recently. Your memory is adapting!`,
        icon: TrendingUp,
        bgColor: "bg-lilac",
      };
    if (optimalHours.length > 0 && optimalHours.includes(currentHour))
      return {
        message: "Peak brain hour! ⚡",
        subtext: "You perform best at this time of day. Make the most of it!",
        icon: Zap,
        bgColor: "bg-citrus",
      };
    if (totalCardsStudied >= 50)
      return {
        message: `${totalCardsStudied} cards today! 🚀`,
        subtext: "You're on fire today! An impressive study session.",
        icon: TrendingUp,
        bgColor: "bg-lilac",
      };
    if (totalCardsStudied >= 20)
      return {
        message: `${totalCardsStudied} cards down today 💪`,
        subtext:
          "Solid session so far! Every card strengthens the neural pathways.",
        icon: TrendingUp,
        bgColor: "bg-lilac",
      };
    if (totalStudyTime >= 30)
      return {
        message: `${Math.round(totalStudyTime)} mins studied today ⏱️`,
        subtext:
          "Great focus session. Keep this pace and your retention will compound.",
        icon: Zap,
        bgColor: "bg-citrus",
      };
    if (srsRecallRate >= 95 && totalCardsStudied >= 5)
      return {
        message: "Near-perfect recall! ⭐",
        subtext:
          "Your retention is outstanding. The spaced repetition is working.",
        icon: Award,
        bgColor: "bg-mint",
      };
    if (srsRecallRate >= 85 && totalCardsStudied >= 5)
      return {
        message: `${Math.round(srsRecallRate)}% recall rate 🎯`,
        subtext:
          "Strong recall across your cards. Your study method is paying off.",
        icon: Target,
        bgColor: "bg-mint",
      };
    if (currentStreak >= 7)
      return {
        message: `${currentStreak}-day streak 🔥`,
        subtext:
          "A full week of consistency! Knowledge compounds with every day.",
        icon: Flame,
        bgColor: "bg-citrus",
      };
    if (trend?.trend === "declining")
      return {
        message: "Time to refocus 🎯",
        subtext:
          "Your recall rate dipped recently. A focused session today can turn it around!",
        icon: Target,
        bgColor: "bg-blush",
      };
    if (currentStreak >= 3)
      return {
        message: `${currentStreak} days strong! 💫`,
        subtext:
          "The hardest part is behind you. You're building a real habit!",
        icon: Zap,
        bgColor: "bg-citrus",
      };
    if (totalCardsStudied > 0)
      return {
        message: "Nice start today! ✨",
        subtext: `${totalCardsStudied} card${totalCardsStudied !== 1 ? "s" : ""} studied so far. Keep the momentum going!`,
        icon: Zap,
        bgColor: "bg-citrus",
      };
    if (totalCards > 0)
      return {
        message: "Ready to learn 📚",
        subtext:
          "Your cards are waiting. Even a quick 5-minute session makes a difference!",
        icon: BookOpen,
        bgColor: "bg-mint",
      };

    return {
      message: "Welcome! 👋",
      subtext: "Create your first deck and start mastering new concepts.",
      icon: BookOpen,
      bgColor: "bg-blush",
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
        body: JSON.stringify({ ...newDeckData, userId: session?.user?.id }),
      });
      if (!res.ok) throw new Error("Failed");
      dismissToast();
      showToast("Success!", "success");
      setIsAddDeckModalOpen(false);
      router.push("/decks");
    } catch {
      dismissToast();
      showToast("Error", "error");
    }
  };

  return (
    <div className="space-y-8 mx-auto pb-8 font-sans selection:bg-mint selection:text-foreground">
      
      {/* ── Row 1: Greeting + Quick Actions ── */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-stretch">
        <div className={`bento-card ${insight.bgColor} flex-1 flex flex-col justify-center relative overflow-hidden group min-h-[240px]`}>
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-background/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="relative z-10 h-full">
            {isStatsLoading ? (
              <div className="animate-pulse flex h-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <div className="h-3 bg-black/5 dark:bg-white/5 rounded w-32 mb-4"></div>
                    <div className="h-12 bg-black/5 dark:bg-white/5 rounded w-3/4 mb-2"></div>
                    <div className="h-12 bg-black/5 dark:bg-white/5 rounded w-1/2"></div>
                  </div>
                  <div className="mt-8 flex items-start gap-4 bg-background/60 border-2 border-border rounded-2xl p-4 w-full max-w-lg">
                    <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 shrink-0"></div>
                    <div className="mt-0.5 space-y-2 w-full">
                      <div className="h-4 bg-black/5 dark:bg-white/5 rounded w-1/3"></div>
                      <div className="h-3 bg-black/5 dark:bg-white/5 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block self-end w-full max-w-[250px] md:max-w-[290px]">
                  <div className="h-44 md:h-48 rounded-2xl bg-black/5 dark:bg-white/5 border-2 border-border/40"></div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <p className="font-bold text-[10px] uppercase tracking-[0.2em] mb-2 opacity-70">
                      {format(new Date(), "EEEE, MMMM do")}
                    </p>
                    <h1 className="text-5xl md:text-6xl font-editorial tracking-tight leading-[0.9]">
                      {getGreeting()}, <br className="hidden sm:block" />
                      <span className="italic">{user?.name?.split(" ")[0] || "Scholar"}.</span>
                    </h1>
                  </div>
                  <div className="mt-8 inline-flex items-start gap-4 bg-background/60 backdrop-blur-sm border-2 border-border rounded-2xl p-4 w-full max-w-lg shadow-bento-sm">
                    <div className="w-10 h-10 rounded-full bg-background border-2 border-border flex items-center justify-center shrink-0 shadow-sm">
                      <InsightIcon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="mt-0.5">
                      <p className="text-sm font-bold uppercase tracking-wider">
                        {insight.message.replace(/🔥|👋|🏆|🏅|🎯|💎|📈|⚡|🚀|💪|⏱️|⭐|📚/g, "").trim()}
                      </p>
                      <p className="text-xs font-medium text-foreground/80 mt-0.5">{insight.subtext}</p>
                    </div>
                  </div>
                </div>
                <div className="hidden xl:block self-end w-full max-w-[250px] md:max-w-[290px] lg:w-[290px] pointer-events-none">
                  <Image src="/greeting-illustration.svg" alt="Productive study illustration" width={620} height={470} className="block dark:hidden w-full h-auto" priority />
                  <Image src="/greeting-illustration-dark.svg" alt="Productive study illustration" width={620} height={470} className="hidden dark:block w-full h-auto" priority />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-[320px] shrink-0 flex flex-col [&>div]:h-full">
          <QuickActions onOpenAddDeckModal={() => setIsAddDeckModalOpen(true)} />
        </div>
      </div>

      {/* ── Row 2: Recent Decks (Full Width) ── */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-editorial italic text-foreground/80">Recent Decks</h2>
          <Button
            variant="ghost"
            className="text-xs font-bold uppercase tracking-widest hover:text-lilac"
            onClick={() => router.push("/decks")}
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <RecentDecks />
      </div>

      {/* ── Row 3: Insights & Overview Stats (Same Row, Stretch Height) ── */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-stretch">
        
        {/* Left: Learning Insights */}
        <div className="flex-1 flex flex-col min-w-0">
          <h2 className="text-3xl font-editorial italic text-foreground/80 mb-4">Learning Insights</h2>
          <div className="flex-1 [&>div]:h-full">
            {isPatternsLoading ? (
              <div className="bento-card bg-muted/30 border-dashed p-6 flex flex-col min-h-[300px] animate-pulse justify-center items-center">
                <div className="w-full max-w-md space-y-4 flex flex-col items-center">
                  <div className="h-8 bg-black/5 dark:bg-white/5 rounded-lg w-1/2 mb-2"></div>
                  <div className="h-4 bg-black/5 dark:bg-white/5 rounded w-3/4"></div>
                  <div className="h-4 bg-black/5 dark:bg-white/5 rounded w-2/3"></div>
                  <div className="h-10 bg-black/5 dark:bg-white/5 rounded-full w-32 mt-4"></div>
                </div>
              </div>
            ) : patterns ? (
              <>
                {patterns.requiresMoreSessions ? (
                  <div className="bento-card bg-muted/30 border-dashed text-center p-8 flex flex-col justify-center items-center min-h-[300px]">
                    <div className="max-w-md mx-auto space-y-4">
                      <h3 className="text-2xl font-editorial">Unlock Insights</h3>
                      <p className="text-muted-foreground font-medium">
                        Complete at least {patterns.minimumRequired} study sessions to get personalized learning insights.
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border-2 border-border shadow-bento-sm font-bold text-sm">
                        <span>{patterns.currentSessions} / {patterns.minimumRequired}</span>
                        <span className="text-muted-foreground">sessions</span>
                      </div>
                    </div>
                  </div>
                ) : patterns.insights ? (
                  <InsightsPanel insights={patterns.insights} />
                ) : (
                  <div className="bento-card bg-muted/30 border-dashed text-center p-8 flex flex-col justify-center items-center min-h-[300px]">
                    <p className="font-editorial text-2xl text-muted-foreground">Start studying to unlock insights</p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Right: Overview Stats */}
        <div className="lg:w-[320px] shrink-0 flex flex-col">
          {/* Invisible title to perfectly align the top of the card with the left column */}
          <h2 className="text-3xl font-editorial italic text-foreground/80 mb-4 hidden lg:block invisible">Stats</h2>
          <div className="flex-1 [&>div]:h-full">
            {isStatsLoading ? (
              <div className="w-full h-full bg-muted/30 rounded-3xl border-2 border-dashed border-border p-6 animate-pulse flex flex-col gap-4">
                <div className="h-8 bg-black/5 dark:bg-white/5 rounded-lg w-1/2 mb-4"></div>
                <div className="h-24 bg-black/5 dark:bg-white/5 rounded-2xl w-full"></div>
                <div className="h-24 bg-black/5 dark:bg-white/5 rounded-2xl w-full"></div>
              </div>
            ) : userStats?.overview ? (
              <OverviewStats stats={userStats.overview} layout="vertical" />
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Row 4: Tasks & Queue Widgets (Same Row, Stretch Height) ── */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-stretch">
        
        {/* Left: Tasks */}
        <div className="flex-1 flex flex-col min-w-0">
          <h2 className="text-3xl font-editorial italic text-foreground/80 mb-4 hidden lg:block">Tasks</h2>
          <div className="flex-1 [&>div]:h-full">
            <TodoList />
          </div>
        </div>

        {/* Right: Study Queue / Daily Goal Stack */}
        <div className="lg:w-[320px] shrink-0 flex flex-col">
          <h2 className="text-3xl font-editorial italic text-foreground/80 mb-4 hidden lg:block invisible">Queue</h2>
          <div className="flex flex-col gap-4 flex-1">
            {userStats?.dailyGoalProgress && (
              <DailyGoalWidget progress={userStats.dailyGoalProgress} />
            )}
            <div className="flex-1 [&>div]:h-full">
              <StudyQueueWidget decks={dueTodayData?.queueDecks ?? []} isLoading={isDueTodayLoading} />
            </div>
            {dueTodayData && dueTodayData.totalAtRisk > 0 && (
              <RetentionRiskWidget totalAtRisk={dueTodayData.totalAtRisk} atRiskDecks={dueTodayData.atRiskDecks ?? []} />
            )}
          </div>
        </div>
      </div>

      {/* ── Row 5: Heatmap (Full Width) ── */}
      <div className="w-full">
        {isStatsLoading ? (
          <div className="bento-card bg-muted/30 border-dashed border-border p-6 animate-pulse min-h-[300px]">
            <div className="h-6 bg-black/5 dark:bg-white/5 rounded w-1/4 mb-4"></div>
            <div className="h-40 bg-black/5 dark:bg-white/5 rounded-xl w-full"></div>
          </div>
        ) : userStats?.dailyStats && userStats.dailyStats.length > 0 ? (
          <HeatmapCalendar dailyStats={userStats.dailyStats} />
        ) : (
          <div className="bento-card bg-muted/30 border-dashed text-center p-8 flex flex-col justify-center items-center">
            <p className="font-editorial text-xl text-muted-foreground">No recent activity</p>
          </div>
        )}
      </div>

      <AddDeckModal
        open={isAddDeckModalOpen}
        onOpenChange={setIsAddDeckModalOpen}
        onAddDeck={handleAddDeck}
        folders={[]}
      />
    </div>
  );
}