import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import UserStudySession from "@/lib/models/UserStudySession";
import UserCardProgress from "@/lib/models/UserCardProgress";
import UserLearningProfile from "@/lib/models/UserLearningProfile";

// Calculate study streak from sessions
function calculateStreak(sessions: any[]): { current: number; longest: number } {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  const sortedDates = sessions
    .map((s) => new Date(s.sessionStart).toDateString())
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Check if studied today or yesterday for current streak
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    currentStreak = 1;
    tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffTime = prevDate.getTime() - currDate.getTime();
      const diffDays = Math.floor(diffTime / 86400000);

      if (diffDays === 1) {
        currentStreak++;
        tempStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  tempStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffTime = prevDate.getTime() - currDate.getTime();
    const diffDays = Math.floor(diffTime / 86400000);

    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { current: currentStreak, longest: longestStreak };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const period = searchParams.get("period") || "30"; // days

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await ConnectDB();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get study sessions for period
    const sessions = await UserStudySession.find({
      userId,
      sessionStart: { $gte: startDate },
    }).sort({ sessionStart: -1 });

    // Get all card progress for retention calculation
    const cardProgress = await UserCardProgress.find({ userId });

    // Get or create user learning profile
    let profile = await UserLearningProfile.findOne({ userId });
    if (!profile) {
      profile = await UserLearningProfile.create({
        userId,
        learningSpeed: "medium",
        optimalSessionLength: 20,
        dailyReviewGoal: 20,
      });
    }

    // Calculate metrics
    const totalCardsStudied = sessions.reduce(
      (sum, s) => sum + s.cardsReviewed,
      0
    );

    const totalStudyTimeMinutes = sessions.reduce((sum, s) => {
      const duration =
        (new Date(s.sessionEnd).getTime() -
          new Date(s.sessionStart).getTime()) /
        60000;
      return sum + duration;
    }, 0);

    const averageAccuracy =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.averageAccuracy, 0) /
          sessions.length
        : 0;

    // Calculate retention rate from card progress
    const reviewedCards = cardProgress.filter((c) => c.reviewCount > 0);
    const averageRetention =
      reviewedCards.length > 0
        ? reviewedCards.reduce((sum, c) => sum + c.retentionRate, 0) /
          reviewedCards.length
        : 0;

    // Calculate today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySessions = sessions.filter((s) => new Date(s.sessionStart) >= todayStart);
    const todayCardsStudied = todaySessions.reduce(
      (sum, s) => sum + s.cardsReviewed,
      0
    );
    const todayStudyTimeMinutes = todaySessions.reduce((sum, s) => {
      const duration =
        (new Date(s.sessionEnd).getTime() -
          new Date(s.sessionStart).getTime()) /
        60000;
      return sum + duration;
    }, 0);

    // Calculate streak
    const allSessions = await UserStudySession.find({ userId }).sort({
      sessionStart: -1,
    });
    const streak = calculateStreak(allSessions);

    // Daily breakdown for last 30 days
    const dailyStats = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySessions = sessions.filter((s) => {
        const sessionDate = new Date(s.sessionStart);
        return sessionDate >= date && sessionDate < nextDate;
      });

      const cardsStudied = daySessions.reduce(
        (sum, s) => sum + s.cardsReviewed,
        0
      );
      const studyTime = daySessions.reduce((sum, s) => {
        const duration =
          (new Date(s.sessionEnd).getTime() -
            new Date(s.sessionStart).getTime()) /
          60000;
        return sum + duration;
      }, 0);
      const accuracy =
        daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + s.averageAccuracy, 0) /
            daySessions.length
          : 0;

      dailyStats.unshift({
        date: date.toISOString().split("T")[0],
        cardsStudied,
        studyTime: Math.round(studyTime),
        accuracy: Math.round(accuracy),
        sessions: daySessions.length,
      });
    }

    // Mastery distribution
    const masteryDistribution = {
      new: 0,
      learning: 0,
      relearning: 0,
      young: 0,
      mature: 0,
      mastered: 0,
    };

    cardProgress.forEach((card) => {
      if (card.currentState === "new") {
        masteryDistribution.new++;
      } else if (card.currentState === "learning") {
        masteryDistribution.learning++;
      } else if (card.currentState === "relearning") {
        masteryDistribution.relearning++;
      } else if (card.intervalDays < 14) {
        masteryDistribution.young++;
      } else if (
        card.intervalDays >= 14 &&
        card.reviewCount >= 4 &&
        card.easeFactor >= 2.2 &&
        card.lapseCount <= 3
      ) {
        masteryDistribution.mastered++;
      } else {
        masteryDistribution.mature++;
      }
    });

    const stats = {
      overview: {
        totalCardsStudied: todayCardsStudied,
        totalStudyTime: Math.round(todayStudyTimeMinutes),
        averageAccuracy: Math.round(averageAccuracy),
        averageRetention: Math.round(averageRetention),
        currentStreak: streak.current,
        longestStreak: streak.longest,
        totalCards: cardProgress.length,
        sessionsCompleted: sessions.length,
      },
      dailyStats,
      masteryDistribution,
      profile: {
        learningSpeed: profile.learningSpeed,
        optimalSessionLength: profile.optimalSessionLength,
        dailyReviewGoal: profile.dailyReviewGoal,
        difficultyPreference: profile.difficultyPreference,
        totalStudyTime: profile.totalStudyTime,
      },
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats", details: error.message },
      { status: 500 }
    );
  }
}
