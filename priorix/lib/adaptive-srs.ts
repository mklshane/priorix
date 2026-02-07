/**
 * Adaptive Spaced Repetition System (SRS)
 * 
 * Features:
 * - Personalized ease factors based on user learning speed
 * - Forget probability calculation using Ebbinghaus curve
 * - Dynamic interval calculation with difficulty modifiers
 * - Context-aware adjustments based on recent performance
 */

import { IUserCardProgress } from "./models/UserCardProgress";
import { IUserLearningProfile, LearningSpeed } from "./models/UserLearningProfile";

export type Rating = "again" | "hard" | "good" | "easy";

interface AdaptiveSettings {
  learningSteps: number[]; // in minutes
  relearnSteps: number[]; // in minutes
  baseEaseFactor: number;
  minEaseFactor: number;
  maxEaseFactor: number;
  easeAdjustments: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
}

/**
 * Get adaptive settings based on user learning speed
 */
export function getAdaptiveSettings(learningSpeed: LearningSpeed): AdaptiveSettings {
  const baseSettings = {
    learningSteps: [10, 1440], // 10 min, 1 day
    relearnSteps: [10, 1440],
    minEaseFactor: 1.3,
    maxEaseFactor: 3.5,
  };

  switch (learningSpeed) {
    case "fast":
      return {
        ...baseSettings,
        baseEaseFactor: 2.7,
        easeAdjustments: {
          again: -0.20,
          hard: -0.10,
          good: 0.05,
          easy: 0.20,
        },
      };
    case "slow":
      return {
        ...baseSettings,
        baseEaseFactor: 2.3,
        easeAdjustments: {
          again: -0.15,
          hard: -0.08,
          good: 0.03,
          easy: 0.15,
        },
      };
    default: // medium
      return {
        ...baseSettings,
        baseEaseFactor: 2.5,
        easeAdjustments: {
          again: -0.17,
          hard: -0.09,
          good: 0.04,
          easy: 0.17,
        },
      };
  }
}

/**
 * Calculate forget probability using Ebbinghaus forgetting curve
 * P(recall) = e^(-t/S)
 * where t = time since last review, S = stability (based on ease and reviews)
 */
export function calculateForgetProbability(
  progress: IUserCardProgress,
  now: Date
): number {
  if (!progress.lastReviewedAt || progress.reviewCount === 0) {
    return 1.0; // New cards have 100% forget probability
  }

  const daysSinceReview =
    (now.getTime() - new Date(progress.lastReviewedAt).getTime()) /
    (1000 * 60 * 60 * 24);

  // Ensure we have valid values
  const intervalDays = progress.intervalDays || 0;
  const easeFactor = progress.easeFactor || 2.5;
  const reviewCount = progress.reviewCount || 0;

  // Stability calculation based on ease factor and review count
  // More reviews and higher ease = more stable
  const stability =
    intervalDays *
    (easeFactor / 2.5) *
    Math.log(reviewCount + 1);

  // Guard against invalid stability
  if (stability === 0 || !isFinite(stability)) {
    return 1.0; // Assume high forget probability for unstable cards
  }

  // Forgetting curve: P(forget) = 1 - e^(-t/S)
  const recallProbability = Math.exp(-daysSinceReview / Math.max(stability, 0.1));
  const forgetProbability = 1 - recallProbability;

  // Ensure result is valid and bounded
  const result = Math.max(0, Math.min(1, forgetProbability));
  return isNaN(result) || !isFinite(result) ? 0 : result;
}

/**
 * Calculate difficulty modifier based on card's perceived difficulty
 * Harder cards get shorter intervals
 */
function getDifficultyModifier(perceivedDifficulty: number): number {
  // Difficulty is 1-10 scale
  // Modifier ranges from 1.2 (easy, difficulty=1) to 0.7 (hard, difficulty=10)
  return 1.2 - (perceivedDifficulty - 1) * 0.055;
}

/**
 * Calculate context modifier based on recent performance
 * If user is struggling recently, reduce intervals
 */
export function getContextModifier(
  recentAccuracy: number,
  averageAccuracy: number
): number {
  if (averageAccuracy === 0) return 1.0;

  const performanceRatio = recentAccuracy / averageAccuracy;

  if (performanceRatio < 0.7) {
    // Struggling: reduce intervals by 20%
    return 0.8;
  } else if (performanceRatio > 1.2) {
    // Doing well: increase intervals by 15%
    return 1.15;
  }

  return 1.0; // Normal performance
}

/**
 * Process a card review and calculate next review schedule
 */
export function processAdaptiveReview(
  rating: Rating,
  progress: IUserCardProgress,
  profile: IUserLearningProfile,
  responseTime: number,
  contextModifier: number = 1.0
): {
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: Date;
  currentState: "new" | "learning" | "review" | "relearning";
  learningStepIndex: number;
  lapseCount: number;
  perceivedDifficulty: number;
  retentionRate: number;
  optimalInterval: number;
  forgetProbability: number;
} {
  const settings = getAdaptiveSettings(profile.learningSpeed);
  const now = new Date();

  let { easeFactor, currentState, learningStepIndex, lapseCount, perceivedDifficulty } = progress;
  
  // Initialize ease factor if needed
  if (!easeFactor || easeFactor === 0) {
    easeFactor = settings.baseEaseFactor;
  }

  // Update perceived difficulty based on performance
  if (rating === "again") {
    perceivedDifficulty = Math.min(10, perceivedDifficulty + 0.5);
  } else if (rating === "easy") {
    perceivedDifficulty = Math.max(1, perceivedDifficulty - 0.3);
  } else if (rating === "hard") {
    perceivedDifficulty = Math.min(10, perceivedDifficulty + 0.2);
  }

  // Calculate retention rate for this card
  const totalReviews = progress.reviewCount + 1;
  const successfulReviews = 
    progress.goodCount + progress.easyCount + (rating === "good" || rating === "easy" ? 1 : 0);
  const retentionRate = (successfulReviews / totalReviews) * 100;

  let intervalDays = 0;
  let nextReviewAt: Date;

  // Handle different states
  if (currentState === "new" || currentState === "learning") {
    if (rating === "again") {
      // Restart learning
      learningStepIndex = 0;
      const nextStepMinutes = settings.learningSteps[0];
      nextReviewAt = new Date(now.getTime() + nextStepMinutes * 60 * 1000);
      currentState = "learning";
    } else if (rating === "hard") {
      // Repeat current step
      const nextStepMinutes = settings.learningSteps[learningStepIndex] || settings.learningSteps[settings.learningSteps.length - 1];
      nextReviewAt = new Date(now.getTime() + nextStepMinutes * 60 * 1000);
      currentState = "learning";
    } else {
      // Move to next step
      learningStepIndex++;
      if (learningStepIndex >= settings.learningSteps.length) {
        // Graduate to review
        currentState = "review";
        
        // Calculate initial interval with personal multipliers
        const baseInterval = rating === "easy" ? 4 : 1;
        const personalMultiplier = profile.personalMultipliers[rating];
        const difficultyMod = getDifficultyModifier(perceivedDifficulty);
        
        intervalDays = baseInterval * personalMultiplier * difficultyMod * contextModifier;
        nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      } else {
        // Next learning step
        const nextStepMinutes = settings.learningSteps[learningStepIndex];
        nextReviewAt = new Date(now.getTime() + nextStepMinutes * 60 * 1000);
        currentState = "learning";
      }
    }
  } else if (currentState === "review") {
    if (rating === "again") {
      // Lapsed - go to relearning
      lapseCount++;
      currentState = "relearning";
      learningStepIndex = 0;
      
      const nextStepMinutes = settings.relearnSteps[0];
      nextReviewAt = new Date(now.getTime() + nextStepMinutes * 60 * 1000);
      
      // Reduce ease factor significantly on lapse
      easeFactor = Math.max(
        settings.minEaseFactor,
        easeFactor + settings.easeAdjustments.again
      );
    } else {
      // Continue reviewing
      // Adjust ease factor
      easeFactor += settings.easeAdjustments[rating];
      easeFactor = Math.max(
        settings.minEaseFactor,
        Math.min(settings.maxEaseFactor, easeFactor)
      );
      
      // Calculate new interval
      const personalMultiplier = profile.personalMultipliers[rating];
      const difficultyMod = getDifficultyModifier(perceivedDifficulty);
      
      let newInterval: number;
      if (rating === "hard") {
        newInterval = progress.intervalDays * 1.2 * personalMultiplier * difficultyMod;
      } else if (rating === "good") {
        newInterval = progress.intervalDays * easeFactor * personalMultiplier * difficultyMod;
      } else { // easy
        newInterval = progress.intervalDays * easeFactor * 1.3 * personalMultiplier * difficultyMod;
      }
      
      intervalDays = newInterval * contextModifier;
      
      // Apply minimum interval of 1 day
      intervalDays = Math.max(1, intervalDays);
      
      nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    }
  } else { // relearning
    if (rating === "again") {
      // Restart relearning
      learningStepIndex = 0;
      const nextStepMinutes = settings.relearnSteps[0];
      nextReviewAt = new Date(now.getTime() + nextStepMinutes * 60 * 1000);
    } else if (rating === "hard") {
      // Repeat current relearning step
      const nextStepMinutes = settings.relearnSteps[learningStepIndex] || settings.relearnSteps[settings.relearnSteps.length - 1];
      nextReviewAt = new Date(now.getTime() + nextStepMinutes * 60 * 1000);
    } else {
      // Move forward in relearning
      learningStepIndex++;
      if (learningStepIndex >= settings.relearnSteps.length) {
        // Graduate back to review
        currentState = "review";
        
        // Resume at reduced interval
        intervalDays = Math.max(
          1,
          progress.intervalDays * 0.5 * profile.personalMultipliers[rating] * contextModifier
        );
        nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      } else {
        // Next relearning step
        const nextStepMinutes = settings.relearnSteps[learningStepIndex];
        nextReviewAt = new Date(now.getTime() + nextStepMinutes * 60 * 1000);
      }
    }
  }

  // Calculate optimal interval (theoretical best based on retention curve)
  const optimalInterval = intervalDays;

  // Calculate new forget probability
  const mockProgress = {
    ...progress,
    lastReviewedAt: now,
    intervalDays,
    easeFactor,
    reviewCount: (progress.reviewCount || 0) + 1, // Include updated review count
  };
  const forgetProbability = calculateForgetProbability(mockProgress as IUserCardProgress, 
    new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)
  );

  return {
    easeFactor,
    intervalDays,
    nextReviewAt,
    currentState,
    learningStepIndex,
    lapseCount,
    perceivedDifficulty,
    retentionRate,
    optimalInterval,
    forgetProbability: isNaN(forgetProbability) ? 0 : forgetProbability,
  };
}

/**
 * Calculate forgetting curve slope for analytics
 */
export function calculateForgettingCurveSlope(
  reviewHistory: Array<{ date: Date; success: boolean }>
): number {
  if (reviewHistory.length < 3) return 0;

  // Simple linear regression on success rate over time
  const points = reviewHistory.map((r, i) => ({
    x: i,
    y: r.success ? 1 : 0,
  }));

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  return slope;
}
