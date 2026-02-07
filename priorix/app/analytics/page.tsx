"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
// Analytics components
import {
  OverviewStats,
  PerformanceChart,
  MasteryDistribution,
  HeatmapCalendar,
  DeckPerformance,
  InsightsPanel,
  StudyTimeHeatmap,
} from "@/components/analytics";

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [period, setPeriod] = useState("30");

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["userStats", session?.user?.id, period],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/user-stats?userId=${session?.user?.id}&period=${period}`
      );
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch deck insights
  const { data: deckInsights, isLoading: decksLoading } = useQuery({
    queryKey: ["deckInsights", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/deck-insights?userId=${session?.user?.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch deck insights");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch learning patterns
  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ["learningPatterns", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/learning-patterns?userId=${session?.user?.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch patterns");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-7xl">
        <p>Please sign in to view analytics</p>
      </div>
    );
  }

  const isLoading = statsLoading || decksLoading || patternsLoading;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold font-sora leading-tight">Learning Analytics</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track your progress and discover insights about your learning patterns
        </p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 w-full sm:w-auto">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 w-full sm:w-auto border-2 border-black dark:border-darkborder rounded-xl bg-background dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary font-sora"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="space-y-8">
        {/* Tabs for different views */}
        <div className="border-b-2 border-border">
          <div className="flex space-x-4 overflow-x-auto no-scrollbar py-1" aria-label="Analytics tabs">
            <button
              onClick={() => setSelectedTab("overview")}
              className={`px-4 py-2 font-medium font-sora transition-colors ${
                selectedTab === "overview"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab("performance")}
              className={`px-4 py-2 font-medium font-sora transition-colors ${
                selectedTab === "performance"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setSelectedTab("insights")}
              className={`px-4 py-2 font-medium font-sora transition-colors ${
                selectedTab === "insights"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Insights
            </button>
            <button
              onClick={() => setSelectedTab("patterns")}
              className={`px-4 py-2 font-medium font-sora transition-colors ${
                selectedTab === "patterns"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Patterns
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {selectedTab === "overview" && userStats && (
              <div className="space-y-6">
                <OverviewStats stats={userStats.overview} />
                <MasteryDistribution
                  distribution={userStats.masteryDistribution}
                />
                <HeatmapCalendar dailyStats={userStats.dailyStats} />
              </div>
            )}

            {/* Performance Tab */}
            {selectedTab === "performance" && userStats && deckInsights && (
              <div className="space-y-6">
                <PerformanceChart dailyStats={userStats.dailyStats} />
                <DeckPerformance decks={deckInsights.decks} />
              </div>
            )}

            {/* Insights Tab */}
            {selectedTab === "insights" && (
              <div className="space-y-6">
                {patterns?.requiresMoreSessions ? (
                  <div className="bg-purple/20 dark:bg-card p-12 rounded-xl border-2 border-black/10 dark:border-darkborder text-center">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-lg font-semibold mb-2 font-sora">
                        Not Enough Data Yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Complete at least {patterns.minimumRequired} study sessions to unlock personalized insights about your learning patterns.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Current sessions: {patterns.currentSessions} / {patterns.minimumRequired}
                      </p>
                    </div>
                  </div>
                ) : patterns?.insights ? (
                  <>
                    <InsightsPanel insights={patterns.insights} />
                    {patterns.performanceTrend && (
                      <div className="bg-green/20 dark:bg-card p-6 rounded-xl border-2 border-black/10 dark:border-darkborder">
                        <h3 className="text-lg font-semibold mb-4 font-sora">
                          Performance Trend
                        </h3>
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Recent</p>
                            <p className="text-2xl font-bold">
                              {patterns.performanceTrend.recentAccuracy}%
                            </p>
                          </div>
                          <div className="text-2xl">→</div>
                          <div>
                            <p className="text-sm text-muted-foreground">Change</p>
                            <p
                              className={`text-2xl font-bold ${
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
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-pink/20 dark:bg-card p-12 rounded-xl border-2 border-black/10 dark:border-darkborder text-center">
                    <p className="text-muted-foreground font-sora">No insights available</p>
                  </div>
                )}
              </div>
            )}

            {/* Patterns Tab */}
            {selectedTab === "patterns" && (
              <div className="space-y-6">
                {patterns?.requiresMoreSessions ? (
                  <div className="bg-yellow/20 dark:bg-card p-12 rounded-xl border-2 border-black/10 dark:border-darkborder text-center">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-lg font-semibold mb-2 font-sora">
                        Not Enough Data Yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Complete at least {patterns.minimumRequired} study sessions to analyze your learning patterns.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Current sessions: {patterns.currentSessions} / {patterns.minimumRequired}
                      </p>
                    </div>
                  </div>
                ) : patterns?.timeOfDayStats ? (
                  <>
                    <StudyTimeHeatmap timeOfDayStats={patterns.timeOfDayStats} />
                    {patterns.weekdayPerformance && (
                      <div className="bg-perry/20 dark:bg-card p-6 rounded-xl border-2 border-black/10 dark:border-darkborder">
                        <h3 className="text-lg font-semibold mb-4 font-sora">
                          Day of Week Performance
                        </h3>
                        <div className="grid grid-cols-7 gap-2">
                          {patterns.weekdayPerformance.map((day: any) => (
                            <div key={day.day} className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">
                                {day.day}
                              </p>
                              <div className="bg-primary/10 p-3 rounded">
                                <p className="text-sm font-semibold">
                                  {day.averageAccuracy}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {day.sessions} sessions
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-purple/20 dark:bg-card p-12 rounded-xl border-2 border-black/10 dark:border-darkborder text-center">
                    <p className="text-muted-foreground font-sora">No patterns available</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
