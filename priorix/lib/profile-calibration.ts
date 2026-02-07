/**
 * Learning Profile Calibration System
 * 
 * Analyzes user performance data to classify learning speed
 * and optimize personal multipliers
 */

import UserCardProgress from "./models/UserCardProgress";
import UserLearningProfile from "./models/UserLearningProfile";
import UserStudySession from "./models/UserStudySession";
import { LearningSpeed } from "./models/UserLearningProfile";

interface CalibrationResult {
  learningSpeed: LearningSpeed;
  confidenceLevel: number; // 0-1
  recommendedMultipliers: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
  optimalSessionLength: number;
  needsMoreData: boolean;
}

/**
 * Calibrate user's learning profile based on review history
 */
export async function calibrateUserProfile(
  userId: string
): Promise<CalibrationResult> {
  // Get user's card progress
  const cardProgress = await UserCardProgress.find({ userId });
  
  // Get study sessions
  const sessions = await UserStudySession.find({ userId }).sort({
    sessionStart: -1,
  }).limit(50);

  if (cardProgress.length < 20) {
    return {
      learningSpeed: "medium",
      confidenceLevel: 0,
      recommendedMultipliers: {
        again: 1.0,
        hard: 1.2,
        good: 2.5,
        easy: 3.5,
      },
      optimalSessionLength: 20,
      needsMoreData: true,
    };
  }

  // Calculate overall accuracy
  const reviewedCards = cardProgress.filter((c) => c.reviewCount > 0);
  const totalReviews = reviewedCards.reduce((sum, c) => c.reviewCount, 0);
  const successfulReviews = reviewedCards.reduce(
    (sum, c) => c.goodCount + c.easyCount,
    0
  );
  const overallAccuracy = (successfulReviews / totalReviews) * 100;

  // Calculate average response time
  const avgResponseTime = reviewedCards.reduce(
    (sum, c) => sum + c.averageResponseTime,
    0
  ) / reviewedCards.length;

  // Determine learning speed
  let learningSpeed: LearningSpeed;
  let confidenceLevel: number;

  if (overallAccuracy >= 85 && avgResponseTime < 7000) {
    learningSpeed = "fast";
    confidenceLevel = 0.9;
  } else if (overallAccuracy >= 75 && avgResponseTime < 10000) {
    learningSpeed = "medium";
    confidenceLevel = 0.85;
  } else if (overallAccuracy >= 70) {
    learningSpeed = "medium";
    confidenceLevel = 0.7;
  } else {
    learningSpeed = "slow";
    confidenceLevel = 0.8;
  }

  // Calculate optimal session length from session data
  const sessionLengthPerformance = new Map<string, { count: number; avgAccuracy: number }>();
  
  sessions.forEach((s) => {
    let category: string;
    if (s.cardsReviewed <= 10) category = "short";
    else if (s.cardsReviewed <= 25) category = "medium";
    else if (s.cardsReviewed <= 40) category = "long";
    else category = "veryLong";

    const current = sessionLengthPerformance.get(category) || {
      count: 0,
      avgAccuracy: 0,
    };
    
    sessionLengthPerformance.set(category, {
      count: current.count + 1,
      avgAccuracy: current.avgAccuracy + s.averageAccuracy,
    });
  });

  // Find best performing session length
  let optimalSessionLength = 20;
  let bestAccuracy = 0;

  for (const [category, data] of sessionLengthPerformance.entries()) {
    if (data.count >= 3) {
      const avgAccuracy = data.avgAccuracy / data.count;
      if (avgAccuracy > bestAccuracy) {
        bestAccuracy = avgAccuracy;
        if (category === "short") optimalSessionLength = 10;
        else if (category === "medium") optimalSessionLength = 20;
        else if (category === "long") optimalSessionLength = 30;
        else optimalSessionLength = 40;
      }
    }
  }

  // Calculate recommended multipliers based on performance
  const baseMultipliers = {
    again: 1.0,
    hard: 1.2,
    good: 2.5,
    easy: 3.5,
  };

  // Adjust multipliers based on learning speed
  let recommendedMultipliers = { ...baseMultipliers };
  
  if (learningSpeed === "fast") {
    // Fast learners can handle longer intervals
    recommendedMultipliers = {
      again: 1.0,
      hard: 1.3,
      good: 2.8,
      easy: 4.0,
    };
  } else if (learningSpeed === "slow") {
    // Slow learners benefit from shorter intervals
    recommendedMultipliers = {
      again: 1.0,
      hard: 1.1,
      good: 2.2,
      easy: 3.0,
    };
  }

  return {
    learningSpeed,
    confidenceLevel,
    recommendedMultipliers,
    optimalSessionLength,
    needsMoreData: false,
  };
}

/**
 * Detect if user needs recalibration
 */
export async function needsRecalibration(userId: string): Promise<boolean> {
  const profile = await UserLearningProfile.findOne({ userId });
  
  if (!profile) return true;
  
  // Never calibrated
  if (!profile.isCalibrated) return true;

  // Last calibration was more than 100 reviews ago
  if (profile.calibrationReviews > 100) return true;

  // Last calibration was more than 30 days ago
  if (profile.lastCalibrationDate) {
    const daysSinceCalibration =
      (Date.now() - new Date(profile.lastCalibrationDate).getTime()) /
      (1000 * 60 * 60 * 24);
    
    if (daysSinceCalibration > 30) return true;
  }

  return false;
}

/**
 * Apply calibration results to user profile
 */
export async function applyCalibration(
  userId: string,
  calibration: CalibrationResult
): Promise<void> {
  const profile = await UserLearningProfile.findOne({ userId });
  
  if (!profile) {
    throw new Error("User profile not found");
  }

  profile.learningSpeed = calibration.learningSpeed;
  profile.personalMultipliers = calibration.recommendedMultipliers;
  profile.optimalSessionLength = calibration.optimalSessionLength;
  profile.isCalibrated = true;
  profile.lastCalibrationDate = new Date();
  profile.calibrationReviews = 0; // Reset counter

  await profile.save();
}
