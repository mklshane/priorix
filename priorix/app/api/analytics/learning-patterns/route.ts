import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import UserStudySession from "@/lib/models/UserStudySession";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await ConnectDB();

    // Get all study sessions for pattern analysis
    const sessions = await UserStudySession.find({ userId }).sort({
      sessionStart: 1,
    });

    if (sessions.length < 5) {
      return NextResponse.json({
        message: "Not enough data for pattern analysis",
        requiresMoreSessions: true,
        currentSessions: sessions.length,
        minimumRequired: 5,
      });
    }

    // Time-of-day performance analysis
    const hourlyPerformance = new Array(24).fill(0).map(() => ({
      sessions: 0,
      totalAccuracy: 0,
      totalCards: 0,
    }));

    sessions.forEach((s) => {
      const hour = s.timeOfDay;
      hourlyPerformance[hour].sessions++;
      hourlyPerformance[hour].totalAccuracy += s.averageAccuracy;
      hourlyPerformance[hour].totalCards += s.cardsReviewed;
    });

    const timeOfDayStats = hourlyPerformance.map((data, hour) => ({
      hour,
      sessions: data.sessions,
      averageAccuracy:
        data.sessions > 0
          ? Math.round(data.totalAccuracy / data.sessions)
          : 0,
      averageCards:
        data.sessions > 0
          ? Math.round(data.totalCards / data.sessions)
          : 0,
    }));

    // Find optimal study times (top 3 hours with best accuracy and enough sessions)
    const optimalTimes = timeOfDayStats
      .filter((t) => t.sessions >= 2)
      .sort((a, b) => b.averageAccuracy - a.averageAccuracy)
      .slice(0, 3)
      .map((t) => t.hour);

    // Session length analysis
    const sessionLengthBuckets = {
      short: { count: 0, totalAccuracy: 0, range: "1-10 cards" },
      medium: { count: 0, totalAccuracy: 0, range: "11-25 cards" },
      long: { count: 0, totalAccuracy: 0, range: "26-40 cards" },
      veryLong: { count: 0, totalAccuracy: 0, range: "40+ cards" },
    };

    sessions.forEach((s) => {
      const cards = s.cardsReviewed;
      if (cards <= 10) {
        sessionLengthBuckets.short.count++;
        sessionLengthBuckets.short.totalAccuracy += s.averageAccuracy;
      } else if (cards <= 25) {
        sessionLengthBuckets.medium.count++;
        sessionLengthBuckets.medium.totalAccuracy += s.averageAccuracy;
      } else if (cards <= 40) {
        sessionLengthBuckets.long.count++;
        sessionLengthBuckets.long.totalAccuracy += s.averageAccuracy;
      } else {
        sessionLengthBuckets.veryLong.count++;
        sessionLengthBuckets.veryLong.totalAccuracy += s.averageAccuracy;
      }
    });

    const sessionLengthStats = Object.entries(sessionLengthBuckets).map(
      ([key, data]) => ({
        category: key,
        range: data.range,
        sessions: data.count,
        averageAccuracy:
          data.count > 0
            ? Math.round(data.totalAccuracy / data.count)
            : 0,
      })
    );

    // Find optimal session length
    const optimalLength = sessionLengthStats
      .filter((s) => s.sessions >= 2)
      .sort((a, b) => b.averageAccuracy - a.averageAccuracy)[0];

    // Fatigue detection (accuracy drop-off within sessions)
    const completedSessions = sessions.filter((s) => s.wasCompleted);
    const averageSessionQuality =
      completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + s.sessionQuality, 0) /
          completedSessions.length
        : 0;

    // Recent performance trend (last 10 sessions vs previous 10)
    const recentSessions = sessions.slice(-10);
    const previousSessions = sessions.slice(-20, -10);

    const recentAccuracy =
      recentSessions.length > 0
        ? recentSessions.reduce((sum, s) => sum + s.averageAccuracy, 0) /
          recentSessions.length
        : 0;

    const previousAccuracy =
      previousSessions.length > 0
        ? previousSessions.reduce((sum, s) => sum + s.averageAccuracy, 0) /
          previousSessions.length
        : 0;

    const trend =
      recentAccuracy > previousAccuracy + 5
        ? "improving"
        : recentAccuracy < previousAccuracy - 5
        ? "declining"
        : "stable";

    // Day of week analysis
    const dayOfWeekStats = new Array(7).fill(0).map(() => ({
      sessions: 0,
      totalAccuracy: 0,
      totalCards: 0,
    }));

    sessions.forEach((s) => {
      const day = new Date(s.sessionStart).getDay();
      dayOfWeekStats[day].sessions++;
      dayOfWeekStats[day].totalAccuracy += s.averageAccuracy;
      dayOfWeekStats[day].totalCards += s.cardsReviewed;
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekdayPerformance = dayOfWeekStats.map((data, index) => ({
      day: dayNames[index],
      sessions: data.sessions,
      averageAccuracy:
        data.sessions > 0
          ? Math.round(data.totalAccuracy / data.sessions)
          : 0,
      averageCards:
        data.sessions > 0
          ? Math.round(data.totalCards / data.sessions)
          : 0,
    }));

    // Generate insights
    const insights = [];

    if (optimalTimes.length > 0) {
      const formatHour = (h: number) => {
        const period = h >= 12 ? "PM" : "AM";
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${hour12}${period}`;
      };

      insights.push({
        type: "optimal_time",
        title: "Peak Performance Times",
        description: `Your accuracy is highest when studying around ${optimalTimes.map(formatHour).join(", ")}. Consider scheduling important decks during these times.`,
        priority: "high",
      });
    }

    if (optimalLength) {
      insights.push({
        type: "session_length",
        title: "Optimal Session Length",
        description: `You perform best with ${optimalLength.range} sessions. Your current optimal length appears to be around ${
          optimalLength.category === "short"
            ? "10"
            : optimalLength.category === "medium"
            ? "20"
            : optimalLength.category === "long"
            ? "30"
            : "40"
        } cards.`,
        priority: "medium",
      });
    }

    if (trend === "improving") {
      insights.push({
        type: "performance_trend",
        title: "Great Progress!",
        description: `Your average accuracy has improved by ${Math.round(recentAccuracy - previousAccuracy)}% over your last 10 sessions. Keep up the excellent work!`,
        priority: "high",
      });
    } else if (trend === "declining") {
      insights.push({
        type: "performance_trend",
        title: "Performance Dip Detected",
        description: `Your accuracy has decreased by ${Math.round(previousAccuracy - recentAccuracy)}% recently. Consider taking a short break or reviewing fundamentals.`,
        priority: "high",
      });
    }

    if (averageSessionQuality < 60) {
      insights.push({
        type: "session_quality",
        title: "Low Session Quality",
        description: "Your recent session quality scores suggest fatigue or difficult material. Try shorter sessions or more breaks.",
        priority: "medium",
      });
    }

    return NextResponse.json({
      timeOfDayStats,
      optimalStudyTimes: optimalTimes,
      sessionLengthStats,
      optimalSessionLength: optimalLength?.category,
      weekdayPerformance,
      performanceTrend: {
        trend,
        recentAccuracy: Math.round(recentAccuracy),
        previousAccuracy: Math.round(previousAccuracy),
        change: Math.round(recentAccuracy - previousAccuracy),
      },
      averageSessionQuality: Math.round(averageSessionQuality),
      insights,
      totalSessionsAnalyzed: sessions.length,
    });
  } catch (error: any) {
    console.error("Error analyzing learning patterns:", error);
    return NextResponse.json(
      { error: "Failed to analyze learning patterns", details: error.message },
      { status: 500 }
    );
  }
}
