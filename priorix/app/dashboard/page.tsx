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
  Plus,
} from "lucide-react";

import RecentDecks from "@/components/dashboard/RecentDeck";

import QuickActions from "@/components/dashboard/QuickActions";

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

import LearningStatsWidget from "@/components/dashboard/LearningStatsWidget";

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
        `/api/analytics/user-stats?userId=${session?.user?.id}&period=60`,
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
        `/api/analytics/learning-patterns?userId=${session?.user?.id}`,
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

        bgColor: "bg-blush text-foreground", // Mapped from pink
      };
    }

    const {
      totalCardsStudied,

      totalStudyTime,

      currentStreak,

      longestStreak,

      averageAccuracy,

      totalCards,
    } = userStats.overview;

    const mastered = userStats?.masteryDistribution?.mastered ?? 0;

    const trend = patterns?.performanceTrend;

    const optimalHours: number[] = patterns?.optimalStudyTimes ?? [];

    const currentHour = new Date().getHours();

    // Priority 1: Epic streak

    if (currentStreak >= 30)
      return {
        message: `${currentStreak}-day streak! 🏆`,

        subtext: "You've built an unbreakable habit. Legendary consistency!",

        icon: Flame,

        bgColor: "bg-citrus",
      };

    // Priority 2: New personal best streak

    if (currentStreak === longestStreak && currentStreak >= 5)
      return {
        message: "New personal best! 🏅",

        subtext: `Your longest streak ever: ${currentStreak} days! History in the making.`,

        icon: Flame,

        bgColor: "bg-citrus",
      };

    // Priority 3 & 4: Mastery milestone

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

    // Priority 5: Accuracy trending up

    if (trend?.trend === "improving" && trend.change > 0)
      return {
        message: "Accuracy trending up! 📈",

        subtext: `Your accuracy improved by ${Math.abs(trend.change)}% recently. Your brain is adapting!`,

        icon: TrendingUp,

        bgColor: "bg-lilac",
      };

    // Priority 6: Optimal study time match

    if (optimalHours.length > 0 && optimalHours.includes(currentHour))
      return {
        message: "Peak brain hour! ⚡",

        subtext: "You perform best at this time of day. Make the most of it!",

        icon: Zap,

        bgColor: "bg-citrus",
      };

    // Priority 7 & 8: Big day today

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

    // Priority 9: Solid study time

    if (totalStudyTime >= 30)
      return {
        message: `${Math.round(totalStudyTime)} mins studied today ⏱️`,

        subtext:
          "Great focus session. Keep this pace and your retention will compound.",

        icon: Zap,

        bgColor: "bg-citrus",
      };

    // Priority 10 & 11: Accuracy

    if (averageAccuracy >= 95 && totalCardsStudied >= 5)
      return {
        message: "Near-perfect recall! ⭐",

        subtext:
          "Your retention is outstanding. The spaced repetition is working.",

        icon: Award,

        bgColor: "bg-mint",
      };

    if (averageAccuracy >= 85 && totalCardsStudied >= 5)
      return {
        message: `${Math.round(averageAccuracy)}% accuracy 🎯`,

        subtext:
          "Strong recall across your cards. Your study method is paying off.",

        icon: Target,

        bgColor: "bg-mint",
      };

    // Priority 12: Long streak

    if (currentStreak >= 7)
      return {
        message: `${currentStreak}-day streak 🔥`,

        subtext:
          "A full week of consistency! Knowledge compounds with every day.",

        icon: Flame,

        bgColor: "bg-citrus",
      };

    // Priority 13: Declining trend

    if (trend?.trend === "declining")
      return {
        message: "Time to refocus 🎯",

        subtext:
          "Your accuracy dipped recently. A focused session today can turn it around!",

        icon: Target,

        bgColor: "bg-blush",
      };

    // Priority 14: Building habit

    if (currentStreak >= 3)
      return {
        message: `${currentStreak} days strong! 💫`,

        subtext:
          "The hardest part is behind you. You're building a real habit!",

        icon: Zap,

        bgColor: "bg-citrus",
      };

    // Priority 15: Active today

    if (totalCardsStudied > 0)
      return {
        message: "Nice start today! ✨",

        subtext: `${totalCardsStudied} card${totalCardsStudied !== 1 ? "s" : ""} studied so far. Keep the momentum going!`,

        icon: Zap,

        bgColor: "bg-citrus",
      };

    // Priority 16: Ready to learn

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
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        <div
          className={`bento-card ${insight.bgColor} flex-1 flex flex-col justify-center relative overflow-hidden group min-h-[240px]`}
        >
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-background/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="font-bold text-[10px] uppercase tracking-[0.2em] mb-2 opacity-70">
                {format(new Date(), "EEEE, MMMM do")}
              </p>
              <h1 className="text-5xl md:text-6xl font-editorial tracking-tight leading-[0.9]">
                {getGreeting()}, <br className="hidden sm:block" />
                <span className="italic">
                  {user?.name?.split(" ")[0] || "Scholar"}.
                </span>
              </h1>
            </div>
            <div className="mt-8 inline-flex items-center gap-3 bg-background/60 backdrop-blur-sm border-2 border-border rounded-2xl p-4 w-fit shadow-bento-sm">
              <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center shrink-0">
                <InsightIcon className="w-4 h-4 text-foreground" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {insight.message}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:w-[320px]">
          <QuickActions
            onOpenAddDeckModal={() => setIsAddDeckModalOpen(true)}
          />
        </div>
      </div>

      {/* Recent Decks */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-editorial italic text-foreground/80">
            Recent Decks
          </h2>
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

      {/* Fixed: Grid for Analytics without redundant containers */}
      {userStats?.dailyStats && userStats.dailyStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <HeatmapCalendar dailyStats={userStats.dailyStats} />
          </div>
          <div className="h-full">
            {userStats?.overview && (
              <OverviewStats stats={userStats.overview} layout="compact" />
            )}
          </div>
        </div>
      )}

      {/* Fixed: Insights Panel (Uses its own bento styling) */}
      {patterns?.insights && <InsightsPanel insights={patterns.insights} />}

      <AddDeckModal
        open={isAddDeckModalOpen}
        onOpenChange={setIsAddDeckModalOpen}
        onAddDeck={handleAddDeck}
        folders={[]}
      />
    </div>
  );
}
