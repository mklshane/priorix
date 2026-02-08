import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import UserStudySession from "@/lib/models/UserStudySession";
import UserLearningProfile from "@/lib/models/UserLearningProfile";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      deckId,
      sessionStart,
      sessionEnd,
      cardsReviewed,
      cardsAgain,
      cardsHard,
      cardsGood,
      cardsEasy,
      averageAccuracy,
      averageResponseTime,
      timeOfDay,
      sessionQuality,
      wasCompleted,
      studyMode,
      quizScore,
      quizType,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await ConnectDB();

    // Save study session
    const studySession = await UserStudySession.create({
      userId,
      deckId,
      sessionStart: new Date(sessionStart),
      sessionEnd: new Date(sessionEnd),
      cardsReviewed,
      cardsAgain,
      cardsHard,
      cardsGood,
      cardsEasy,
      averageAccuracy,
      averageResponseTime,
      timeOfDay,
      sessionQuality,
      wasCompleted,
      studyMode: studyMode || "srs",
      quizScore,
      quizType,
    });

    // Update user learning profile
    const sessionDuration =
      (new Date(sessionEnd).getTime() - new Date(sessionStart).getTime()) /
      60000;

    const profile = await UserLearningProfile.findOne({ userId });
    
    if (profile) {
      // Update total study time
      profile.totalStudyTime += sessionDuration;

      // Update streak
      const today = new Date().toDateString();
      const lastStudy = profile.lastStudyDate
        ? new Date(profile.lastStudyDate).toDateString()
        : null;

      if (lastStudy !== today) {
        // New study day
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastStudy === yesterday) {
          // Consecutive day
          profile.currentStreak += 1;
          profile.longestStreak = Math.max(
            profile.longestStreak,
            profile.currentStreak
          );
        } else if (lastStudy !== today) {
          // Streak broken
          profile.currentStreak = 1;
        }
        profile.lastStudyDate = new Date();
      }

      // Increment calibration reviews for new users
      if (!profile.isCalibrated) {
        profile.calibrationReviews += cardsReviewed;
        if (profile.calibrationReviews >= 20) {
          profile.isCalibrated = true;
          profile.lastCalibrationDate = new Date();
        }
      }

      await profile.save();
    }

    return NextResponse.json({
      success: true,
      sessionId: studySession._id,
    });
  } catch (error: any) {
    console.error("Error saving study session:", error);
    return NextResponse.json(
      { error: "Failed to save study session", details: error.message },
      { status: 500 }
    );
  }
}
