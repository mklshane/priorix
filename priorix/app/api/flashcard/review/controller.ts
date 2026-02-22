import { ConnectDB } from "@/lib/config/db";
import Flashcard from "@/lib/models/Flashcard";
import UserCardProgress from "@/lib/models/UserCardProgress";
import UserLearningProfile from "@/lib/models/UserLearningProfile";
import UserStudySession from "@/lib/models/UserStudySession";
import { addDays, clampEase, srsConfig } from "@/lib/srs-config";
import type { SrsRating } from "@/lib/srs-config";
import { processAdaptiveReview, getContextModifier } from "@/lib/adaptive-srs";
import { calibrateUserProfile } from "@/lib/profile-calibration";
import { prioritizeCards, balanceWorkload } from "@/lib/review-priority";

const minutesToMs = (minutes: number) => minutes * 60 * 1000;
const forgottenThresholdMs = 14 * 24 * 60 * 60 * 1000;

const computeStalenessStatus = (progress: any) => {
  const lastReviewed = progress.lastReviewedAt
    ? new Date(progress.lastReviewedAt)
    : null;
  if (!lastReviewed) return "notYet";
  const diff = Date.now() - lastReviewed.getTime();
  return diff >= forgottenThresholdMs ? "forgotten" : "recent";
};

const initProgressIfNeeded = async (
  progress: any,
  card: any,
  userId: string,
) => {
  let updated = false;

  if (progress.easeFactor === undefined) {
    progress.easeFactor = card.easeFactor ?? srsConfig.startingEase;
    updated = true;
  }

  if (progress.intervalDays === undefined || progress.intervalDays === null) {
    progress.intervalDays = card.intervalDays ?? 0;
    updated = true;
  }

  if (progress.intervalDays < 0) {
    progress.intervalDays = 0;
    updated = true;
  }

  if (progress.currentState === undefined) {
    progress.currentState = card.currentState ?? "new";
    updated = true;
  }

  if (progress.reviewCount === undefined) {
    progress.reviewCount = card.reviewCount ?? 0;
    updated = true;
  }

  if (progress.againCount === undefined) {
    progress.againCount = card.againCount ?? 0;
    updated = true;
  }

  if (progress.hardCount === undefined) {
    progress.hardCount = card.hardCount ?? 0;
    updated = true;
  }

  if (progress.goodCount === undefined) {
    progress.goodCount = card.goodCount ?? 0;
    updated = true;
  }

  if (progress.easyCount === undefined) {
    progress.easyCount = card.easyCount ?? 0;
    updated = true;
  }

  if (progress.averageResponseTime === undefined) {
    progress.averageResponseTime = card.averageResponseTime ?? 0;
    updated = true;
  }

  if (progress.learningStepIndex === undefined) {
    progress.learningStepIndex = card.learningStepIndex ?? 0;
    updated = true;
  }

  if (progress.lapseCount === undefined) {
    progress.lapseCount = card.lapseCount ?? 0;
    updated = true;
  }

  if (progress.lastReviewedAt === undefined) {
    progress.lastReviewedAt = card.lastReviewedAt ?? null;
    updated = true;
  }

  if (progress.nextReviewAt === undefined) {
    progress.nextReviewAt = card.nextReviewAt ?? null;
    updated = true;
  }

  // Initialize adaptive SRS fields
  if (progress.perceivedDifficulty === undefined) {
    // Seed from AI-estimated difficulty when available, otherwise default to medium (5)
    const aiDifficulty = card.estimatedDifficulty;
    progress.perceivedDifficulty =
      typeof aiDifficulty === "number" && aiDifficulty >= 1 && aiDifficulty <= 10
        ? aiDifficulty
        : 5;
    updated = true;
  }

  if (progress.retentionRate === undefined) {
    progress.retentionRate = 0;
    updated = true;
  }

  if (progress.optimalInterval === undefined) {
    progress.optimalInterval = 0;
    updated = true;
  }

  if (progress.forgetProbability === undefined) {
    progress.forgetProbability = 1.0; // New cards start with high forget probability
    updated = true;
  }

  if (updated) {
    progress.userId = progress.userId || (userId as any);
    progress.cardId = progress.cardId || card._id;
    progress.deckId = progress.deckId || card.deck;
    await progress.save();
  }

  return updated;
};

export const getDueFlashcards = async (
  deckId: string,
  limit = 10,
  userId?: string,
) => {
  await ConnectDB();
  const now = new Date();

  if (!userId) throw new Error("userId is required for SRS due fetch");

  // Get or create user learning profile
  let profile = await UserLearningProfile.findOne({ userId });
  if (!profile) {
    profile = new UserLearningProfile({
      userId,
      learningSpeed: "medium",
      personalMultipliers: {
        again: 1.0,
        hard: 1.2,
        good: 2.5,
        easy: 3.5,
      },
      dailyReviewGoal: 50,
      preferredStudyTimes: [9, 10, 11, 14, 15, 16, 19, 20],
      sessionLengthPreference: 20,
      calibrationReviews: 0,
      isCalibrated: false,
      difficultyPreference: "balanced",
    });
    await profile.save();
  }

  // Get all cards from deck
  const cards = await Flashcard.find({ deck: deckId }).sort({ createdAt: 1 });

  // Ensure progress exists for all cards
  const ensureProgressPromises = cards.map(async (card) => {
    const prog = await UserCardProgress.findOneAndUpdate(
      { userId, cardId: card._id },
      { $setOnInsert: { deckId: card.deck } },
      { upsert: true, new: true },
    );
    await initProgressIfNeeded(prog, card, userId);
    return prog;
  });

  const progressList = await Promise.all(ensureProgressPromises);

  // ──────────────────────────────────────────────────────────────
  // STEP 1: Filter to only cards that are actually due RIGHT NOW.
  //   - New cards (never reviewed, nextReviewAt is null) → due
  //   - Cards whose nextReviewAt ≤ now                  → due
  //   - Cards whose nextReviewAt is in the future       → NOT due, skip
  // This is the fundamental SRS gate: you only see a card when
  // its scheduled review time has arrived.
  // ──────────────────────────────────────────────────────────────
  const dueProgressList = progressList.filter((p) => {
    if (!p.nextReviewAt) return true;              // never reviewed → due
    return new Date(p.nextReviewAt).getTime() <= now.getTime(); // past due
  });

  // STEP 2: Prioritize only the due cards
  const allPrioritized = prioritizeCards(
    dueProgressList,
    profile,
    1.0, // deckImportance
    undefined // no limit yet — we partition first
  );

  // ──────────────────────────────────────────────────────────────
  // STEP 3: Partition into "review" (previously seen) vs "new"
  //   - New = never reviewed (currentState "new", reviewCount 0)
  //   - Review = everything else (learning, review, relearning)
  //
  // The new-card cap (30% of session) only kicks in when there
  // are due review cards competing for slots. When there are no
  // due reviews (e.g., first session on a fresh deck), all slots
  // go to new cards so the session fills to the requested size.
  // ──────────────────────────────────────────────────────────────
  const maxNewCards = Math.max(1, Math.floor(limit * 0.3));
  const reviewPool: typeof allPrioritized = [];
  const newPool: typeof allPrioritized = [];

  for (const card of allPrioritized) {
    const isNew = card.currentState === "new" && (card.reviewCount ?? 0) === 0;
    if (isNew) {
      newPool.push(card);
    } else {
      reviewPool.push(card);
    }
  }

  // STEP 4: Fill the session
  const selected: typeof allPrioritized = [];

  // 4a. Due review cards first (by priority)
  const reviewSlots = Math.min(reviewPool.length, limit);
  selected.push(...reviewPool.slice(0, reviewSlots));

  // 4b. New cards — capped only when review cards exist
  const remainingSlots = limit - selected.length;
  const effectiveNewCap = reviewPool.length > 0
    ? Math.min(newPool.length, maxNewCards, remainingSlots)
    : Math.min(newPool.length, remainingSlots);
  selected.push(...newPool.slice(0, effectiveNewCap));

  // 4c. Backfill with extra new cards if review pool didn't fill
  if (selected.length < limit && newPool.length > effectiveNewCap) {
    const backfill = Math.min(newPool.length - effectiveNewCap, limit - selected.length);
    selected.push(...newPool.slice(effectiveNewCap, effectiveNewCap + backfill));
  }

  // Apply workload balancing to prevent overwhelming sessions
  const { reviewNow } = balanceWorkload(selected, profile.dailyReviewGoal || 50);

  // Use balanced list, but never exceed the requested limit
  const prioritizedCards = reviewNow.slice(0, limit);

  // Map back to include card data
  const cardMap = new Map(cards.map((c) => [String(c._id), c]));

  return prioritizedCards.map((prog) => {
    const card = cardMap.get(String(prog.cardId));
    if (!card) return null;

    const plainCard = card.toObject();
    const plainProg = prog.toObject ? prog.toObject() : { ...prog };
    
    return {
      ...plainCard,
      ...plainProg,
      _id: plainCard._id,
      cardId: plainCard._id,
      progressId: plainProg._id,
      priorityScore: prog.priorityScore,
      urgencyScore: prog.urgencyScore,
      importanceScore: prog.importanceScore,
      stalenessStatus: computeStalenessStatus(plainProg),
    };
  }).filter(Boolean);
};

export const reviewFlashcard = async (data: {
  cardId: string;
  rating: SrsRating;
  responseTimeMs?: number;
  userId?: string;
}) => {
  try {
    await ConnectDB();

    if (!data.userId) throw new Error("userId is required for review");

    const card = await Flashcard.findById(data.cardId);
    if (!card) throw new Error("Flashcard not found");

    const progress = await UserCardProgress.findOneAndUpdate(
      { cardId: data.cardId, userId: data.userId },
      { $setOnInsert: { deckId: card.deck } },
      { upsert: true, new: true },
    );

    await initProgressIfNeeded(progress, card, data.userId);

  const now = new Date();
  const rating = data.rating;

  // Get or create user learning profile
  let profile = await UserLearningProfile.findOne({ userId: data.userId });
  if (!profile) {
    profile = new UserLearningProfile({
      userId: data.userId,
      learningSpeed: "medium",
      personalMultipliers: {
        again: 1.0,
        hard: 1.2,
        good: 2.5,
        easy: 3.5,
      },
      dailyReviewGoal: 50,
      preferredStudyTimes: [9, 10, 11, 14, 15, 16, 19, 20],
      sessionLengthPreference: 20,
      calibrationReviews: 0,
      isCalibrated: false,
      difficultyPreference: "balanced",
    });
    await profile.save();
  }

  // Calculate context modifier from recent sessions
  const recentSessions = await UserStudySession.find({ userId: data.userId })
    .sort({ sessionStart: -1 })
    .limit(3);
  
  let contextModifier = 1.0;
  if (recentSessions.length > 0) {
    const recentAccuracy = 
      recentSessions.reduce((sum, s) => sum + s.averageAccuracy, 0) / recentSessions.length;
    contextModifier = getContextModifier(recentAccuracy, profile.averageRetention || 75);
  }

  // Process review with adaptive algorithm
  const responseTimeSeconds = (data.responseTimeMs || 0) / 1000;
  const result = processAdaptiveReview(
    rating,
    progress,
    profile,
    responseTimeSeconds,
    contextModifier
  );

  // Update progress with results
  progress.easeFactor = result.easeFactor;
  progress.intervalDays = result.intervalDays;
  progress.nextReviewAt = result.nextReviewAt;
  progress.currentState = result.currentState;
  progress.learningStepIndex = result.learningStepIndex;
  progress.lapseCount = result.lapseCount;
  progress.perceivedDifficulty = result.perceivedDifficulty;
  progress.retentionRate = result.retentionRate;
  progress.optimalInterval = result.optimalInterval;
  
  // Guard against NaN values
  progress.forgetProbability = isNaN(result.forgetProbability) || !isFinite(result.forgetProbability) 
    ? 0 
    : result.forgetProbability;
    
  progress.lastReviewedAt = now;
  progress.reviewCount = (progress.reviewCount || 0) + 1;

  // Update rating counts
  if (rating === "again") progress.againCount = (progress.againCount || 0) + 1;
  else if (rating === "hard") progress.hardCount = (progress.hardCount || 0) + 1;
  else if (rating === "good") progress.goodCount = (progress.goodCount || 0) + 1;
  else if (rating === "easy") progress.easyCount = (progress.easyCount || 0) + 1;

  // Update average response time
  if (typeof data.responseTimeMs === "number") {
    const prevCount = Math.max((progress.reviewCount || 1) - 1, 0);
    const prevAvg = progress.averageResponseTime || 0;
    const newAvg =
      prevCount === 0
        ? data.responseTimeMs
        : Math.round((prevAvg * prevCount + data.responseTimeMs) / (prevCount + 1));
    progress.averageResponseTime = newAvg;
  }

  await progress.save();

  // Check if profile calibration is needed (every 20 reviews)
  profile.calibrationReviews = (profile.calibrationReviews || 0) + 1;
  if (profile.calibrationReviews >= 20) {
    // Trigger calibration check
    const calibrationResult = await calibrateUserProfile(data.userId);
    if (!calibrationResult.needsMoreData) {
      profile.learningSpeed = calibrationResult.learningSpeed;
      profile.isCalibrated = true;
      profile.calibrationReviews = 0;
    }
  }
  await profile.save();

    const plainCard = card.toObject();
    const plainProg = progress.toObject();
    return {
      ...plainCard,
      ...plainProg,
      _id: plainCard._id,
      cardId: plainCard._id,
      progressId: plainProg._id,
      stalenessStatus: computeStalenessStatus(plainProg),
    };
  } catch (err) {
    console.error("reviewFlashcard error", {
      cardId: data.cardId,
      userId: data.userId,
      rating: data.rating,
      err,
    });
    throw err;
  }
};
