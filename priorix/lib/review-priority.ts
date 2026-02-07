/**
 * Priority-based Review Queue System
 * 
 * Determines the order in which cards should be reviewed based on:
 * - Urgency (how overdue the card is)
 * - Importance (mastery level and deck priority)
 * - Forget probability
 * - User's difficulty preference
 */

import { IUserCardProgress } from "./models/UserCardProgress";
import { calculateForgetProbability } from "./adaptive-srs";
import { IUserLearningProfile } from "./models/UserLearningProfile";

export interface CardWithPriority extends IUserCardProgress {
  priorityScore: number;
  urgencyScore: number;
  importanceScore: number;
  isOverdue: boolean;
  daysOverdue: number;
}

/**
 * Calculate urgency score (0-1)
 * Higher score = more urgent to review
 */
function calculateUrgency(
  nextReviewAt: Date | null,
  forgetProbability: number,
  now: Date
): { urgency: number; isOverdue: boolean; daysOverdue: number } {
  if (!nextReviewAt) {
    return { urgency: 1.0, isOverdue: true, daysOverdue: 0 };
  }

  const dueTime = new Date(nextReviewAt).getTime();
  const currentTime = now.getTime();
  const msOverdue = currentTime - dueTime;
  const daysOverdue = msOverdue / (1000 * 60 * 60 * 24);

  const isOverdue = daysOverdue > 0;

  if (isOverdue) {
    // Overdue cards: exponential urgency
    // 1 day overdue = 0.6, 7 days = 0.9, 14+ days = 1.0
    const urgency = Math.min(1.0, 0.5 + Math.log(daysOverdue + 1) / 5);
    return { urgency, isOverdue: true, daysOverdue };
  } else {
    // Not yet due: scale by forget probability
    // High forget probability even before due date = higher urgency
    const daysUntilDue = -daysOverdue;
    const timeUrgency = Math.max(0, 1 - daysUntilDue / 14);
    const urgency = timeUrgency * 0.5 + forgetProbability * 0.5;
    return { urgency, isOverdue: false, daysOverdue: 0 };
  }
}

/**
 * Calculate importance score (0-1)
 * Higher score = more important to master
 */
function calculateImportance(
  progress: IUserCardProgress,
  deckImportance: number = 1.0
): number {
  // Importance factors:
  // 1. Inverse of mastery (less mastered = more important)
  // 2. Lapse history (more lapses = more important)
  // 3. Deck importance multiplier

  let masteryLevel = 0;

  if (progress.currentState === "new") {
    masteryLevel = 0;
  } else if (progress.currentState === "learning" || progress.currentState === "relearning") {
    masteryLevel = 0.3;
  } else if (progress.intervalDays < 7) {
    masteryLevel = 0.5;
  } else if (progress.intervalDays < 14) {
    masteryLevel = 0.7;
  } else if (
    progress.intervalDays >= 14 &&
    progress.reviewCount >= 4 &&
    progress.easeFactor >= 2.2 &&
    progress.lapseCount <= 3
  ) {
    masteryLevel = 1.0; // Mastered
  } else {
    masteryLevel = 0.8;
  }

  // Less mastered cards are more important
  const masteryImportance = 1 - masteryLevel;

  // Cards with lapses are more important
  const lapseImportance = Math.min(1.0, progress.lapseCount * 0.2);

  // Combine factors
  const importance =
    masteryImportance * 0.6 + lapseImportance * 0.4;

  return importance * deckImportance;
}

/**
 * Calculate overall priority score
 */
export function calculatePriorityScore(
  progress: IUserCardProgress,
  forgetProbability: number,
  deckImportance: number = 1.0,
  now: Date = new Date()
): {
  priorityScore: number;
  urgencyScore: number;
  importanceScore: number;
  isOverdue: boolean;
  daysOverdue: number;
} {
  const { urgency, isOverdue, daysOverdue } = calculateUrgency(
    progress.nextReviewAt,
    forgetProbability,
    now
  );
  
  const importance = calculateImportance(progress, deckImportance);

  // Priority = urgency × importance
  // Boost overdue cards
  let priorityScore = urgency * importance;
  
  if (isOverdue) {
    priorityScore *= 1.2; // 20% boost for overdue cards
  }

  return {
    priorityScore: Math.min(1.0, priorityScore),
    urgencyScore: urgency,
    importanceScore: importance,
    isOverdue,
    daysOverdue,
  };
}

/**
 * Filter and sort cards based on priority and user preferences
 */
export function prioritizeCards(
  cards: IUserCardProgress[],
  profile: IUserLearningProfile,
  deckImportance: number = 1.0,
  maxCards?: number
): CardWithPriority[] {
  const now = new Date();

  // Calculate priority for each card
  const cardsWithPriority: CardWithPriority[] = cards.map((card) => {
    const forgetProbability = calculateForgetProbability(card, now);
    const priority = calculatePriorityScore(card, forgetProbability, deckImportance, now);

    return {
      ...card.toObject(),
      priorityScore: priority.priorityScore,
      urgencyScore: priority.urgencyScore,
      importanceScore: priority.importanceScore,
      isOverdue: priority.isOverdue,
      daysOverdue: priority.daysOverdue,
      forgetProbability,
    } as CardWithPriority;
  });

  // Apply difficulty preference filter
  let filteredCards = cardsWithPriority;

  if (profile.difficultyPreference === "challenge") {
    // Prioritize harder cards and cards with lapses
    // Adjust priority scores directly
    filteredCards.forEach((card) => {
      card.priorityScore = card.priorityScore * (1 + (card.perceivedDifficulty - 5) * 0.1);
    });
  } else if (profile.difficultyPreference === "confidence") {
    // Mix in more mastered/easier cards for positive reinforcement
    const masteredCards = cardsWithPriority.filter(
      (c) => c.intervalDays >= 14 && c.easeFactor >= 2.2 && c.reviewCount >= 4
    );
    const otherCards = cardsWithPriority.filter(
      (c) => c.intervalDays < 14 || c.easeFactor < 2.2 || c.reviewCount < 4
    );

    // Include 30% mastered cards even if not due
    const masteredToInclude = Math.floor(
      Math.min(masteredCards.length, (maxCards || 20) * 0.3)
    );
    
    filteredCards = [
      ...otherCards,
      ...masteredCards.slice(0, masteredToInclude),
    ];
  }

  // Sort by priority score (highest first)
  filteredCards.sort((a, b) => b.priorityScore - a.priorityScore);

  // Apply max cards limit if specified
  if (maxCards) {
    filteredCards = filteredCards.slice(0, maxCards);
  }

  return filteredCards;
}

/**
 * Get workload for a specific day
 */
export function calculateDailyWorkload(
  allCards: IUserCardProgress[],
  targetDate: Date
): {
  dueCards: number;
  newCards: number;
  reviewCards: number;
  estimatedMinutes: number;
} {
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  let dueCards = 0;
  let newCards = 0;
  let reviewCards = 0;

  allCards.forEach((card) => {
    if (!card.nextReviewAt) {
      if (card.currentState === "new") {
        newCards++;
        dueCards++;
      }
    } else {
      const dueDate = new Date(card.nextReviewAt);
      if (dueDate <= endOfDay) {
        dueCards++;
        if (card.currentState === "review") {
          reviewCards++;
        }
      }
    }
  });

  // Estimate time: ~6 seconds per card on average
  const estimatedMinutes = Math.ceil((dueCards * 6) / 60);

  return {
    dueCards,
    newCards,
    reviewCards,
    estimatedMinutes,
  };
}

/**
 * Balance workload across days
 * If too many cards due on one day, suggest deferring some low-priority reviews
 */
export function balanceWorkload(
  cards: CardWithPriority[],
  dailyGoal: number
): {
  reviewNow: CardWithPriority[];
  deferToTomorrow: CardWithPriority[];
} {
  if (cards.length <= dailyGoal) {
    return {
      reviewNow: cards,
      deferToTomorrow: [],
    };
  }

  // Sort by priority
  const sorted = [...cards].sort((a, b) => b.priorityScore - a.priorityScore);

  // Keep high priority cards for today
  const reviewNow = sorted.slice(0, dailyGoal);

  // Defer low priority cards that aren't critically overdue
  const deferToTomorrow = sorted
    .slice(dailyGoal)
    .filter((card) => card.daysOverdue < 3 && card.urgencyScore < 0.8);

  return {
    reviewNow,
    deferToTomorrow,
  };
}
