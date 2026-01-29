import { ConnectDB } from "@/lib/config/db";
import Flashcard from "@/lib/models/Flashcard";
import { addDays, clampEase, srsConfig } from "@/lib/srs-config";
import type { SrsRating } from "@/lib/srs-config";

const minutesToMs = (minutes: number) => minutes * 60 * 1000;
const forgottenThresholdMs = 14 * 24 * 60 * 60 * 1000;

const computeStalenessStatus = (card: any) => {
  const lastReviewed = card.lastReviewedAt ? new Date(card.lastReviewedAt) : null;
  if (!lastReviewed) return "notYet";
  const diff = Date.now() - lastReviewed.getTime();
  return diff >= forgottenThresholdMs ? "forgotten" : "recent";
};

const initCardIfNeeded = async (card: any) => {
  let updated = false;

  if (card.easeFactor === undefined) {
    card.easeFactor = srsConfig.startingEase;
    updated = true;
  }

  if (card.intervalDays === undefined || card.intervalDays === null) {
    card.intervalDays = 0;
    updated = true;
  }

  if (card.intervalDays < 0) {
    card.intervalDays = 0;
    updated = true;
  }

  if (card.currentState === undefined) {
    card.currentState = "new";
    updated = true;
  }

  if (card.reviewCount === undefined) {
    card.reviewCount = 0;
    updated = true;
  }

  if (card.againCount === undefined) {
    card.againCount = 0;
    updated = true;
  }

  if (card.hardCount === undefined) {
    card.hardCount = 0;
    updated = true;
  }

  if (card.goodCount === undefined) {
    card.goodCount = 0;
    updated = true;
  }

  if (card.easyCount === undefined) {
    card.easyCount = 0;
    updated = true;
  }

  if (card.averageResponseTime === undefined) {
    card.averageResponseTime = 0;
    updated = true;
  }

  if (card.learningStepIndex === undefined) {
    card.learningStepIndex = 0;
    updated = true;
  }

  if (card.lapseCount === undefined) {
    card.lapseCount = 0;
    updated = true;
  }

  if (card.lastReviewedAt === undefined) {
    card.lastReviewedAt = null;
    updated = true;
  }

  if (card.nextReviewAt === undefined) {
    card.nextReviewAt = null;
    updated = true;
  }

  if (updated) {
    await card.save();
  }

  return updated;
};

export const getDueFlashcards = async (
  deckId: string,
  limit = 10
) => {
  await ConnectDB();
  const now = new Date();
  const cooldownMs = (srsConfig.minNextReviewMinutes || 0) * 60 * 1000;
  const recentCutoff = new Date(now.getTime() - cooldownMs);
  const query = {
    deck: deckId,
    $or: [
      { nextReviewAt: { $lte: now } },
      { nextReviewAt: null },
      { nextReviewAt: { $exists: false } },
    ],
  };

  const candidates = await Flashcard.find(query).sort({ nextReviewAt: 1, createdAt: 1 });

  const eligible = candidates.filter(
    (card) => !card.lastReviewedAt || card.lastReviewedAt < recentCutoff,
  );

  // Shuffle to avoid always pulling the same top items when many are due at the same time
  const shuffled = eligible.sort(() => Math.random() - 0.5);
  const cards = shuffled.slice(0, limit);

  await Promise.all(cards.map((card) => initCardIfNeeded(card)));

  return cards.map((card) => {
    const plain = card.toObject();
    return { ...plain, stalenessStatus: computeStalenessStatus(plain) };
  });
};

export const reviewFlashcard = async (data: {
  cardId: string;
  rating: SrsRating;
  responseTimeMs?: number;
}) => {
  await ConnectDB();
  const card = await Flashcard.findById(data.cardId);
  if (!card) throw new Error("Flashcard not found");

  await initCardIfNeeded(card);

  const now = new Date();
  const rating = data.rating;
  let ease = card.easeFactor || srsConfig.startingEase;
  let interval = card.intervalDays ?? srsConfig.minIntervalDays;
  const learningStepIndex = card.learningStepIndex ?? 0;

  const ensureCooldown = (target: Date) => {
    const minNext = new Date(
      now.getTime() + (srsConfig.minNextReviewMinutes || 0) * 60 * 1000,
    );
    return target > minNext ? target : minNext;
  };

  const scheduleLearningStep = (stepIndex: number) => {
    const steps = srsConfig.learningStepsMinutes;
    const idx = Math.min(Math.max(stepIndex, 0), steps.length - 1);
    const delay = steps[idx] ?? srsConfig.minIntervalDays * 24 * 60;
    card.learningStepIndex = idx;
    card.currentState = "learning";
    card.intervalDays = 0;
    card.nextReviewAt = ensureCooldown(
      new Date(now.getTime() + minutesToMs(delay)),
    );
  };

  const scheduleRelearningStep = (stepIndex: number) => {
    const steps = srsConfig.relearningStepsMinutes;
    const idx = Math.min(Math.max(stepIndex, 0), steps.length - 1);
    const delay = steps[idx] ?? srsConfig.minIntervalDays * 24 * 60;
    card.learningStepIndex = idx;
    card.currentState = "relearning";
    card.intervalDays = srsConfig.lapseIntervalDays;
    card.nextReviewAt = ensureCooldown(
      new Date(now.getTime() + minutesToMs(delay)),
    );
  };

  const graduateToReview = (baseIntervalDays: number, easeOverride?: number) => {
    const nextInterval = Math.max(srsConfig.minIntervalDays, baseIntervalDays);
    card.intervalDays = nextInterval;
    card.currentState = "review";
    card.learningStepIndex = 0;
    card.nextReviewAt = ensureCooldown(addDays(now, nextInterval));
    card.easeFactor = clampEase(easeOverride ?? ease);
  };

  const state = card.currentState || "new";

  if (state === "new" || state === "learning") {
    switch (rating) {
      case "again": {
        card.againCount = (card.againCount || 0) + 1;
        ease = clampEase(ease - srsConfig.easeStepDownHard);
        scheduleLearningStep(0);
        break;
      }
      case "hard": {
        card.hardCount = (card.hardCount || 0) + 1;
        ease = clampEase(ease - srsConfig.easeStepDownHard / 2);
        scheduleLearningStep(Math.max(learningStepIndex, 0));
        break;
      }
      case "good": {
        card.goodCount = (card.goodCount || 0) + 1;
        const nextStep = learningStepIndex + 1;
        if (nextStep < srsConfig.learningStepsMinutes.length) {
          scheduleLearningStep(nextStep);
        } else {
          graduateToReview(srsConfig.initialReviewIntervalDays, ease);
        }
        break;
      }
      case "easy": {
        card.easyCount = (card.easyCount || 0) + 1;
        graduateToReview(
          srsConfig.easyGraduatingIntervalDays,
          ease + srsConfig.easeStepUpEasy,
        );
        break;
      }
      default:
        break;
    }
  } else if (state === "relearning") {
    switch (rating) {
      case "again": {
        card.againCount = (card.againCount || 0) + 1;
        scheduleRelearningStep(0);
        break;
      }
      case "hard": {
        card.hardCount = (card.hardCount || 0) + 1;
        scheduleRelearningStep(Math.max(learningStepIndex, 0));
        break;
      }
      case "good": {
        card.goodCount = (card.goodCount || 0) + 1;
        const nextStep = learningStepIndex + 1;
        if (nextStep < srsConfig.relearningStepsMinutes.length) {
          scheduleRelearningStep(nextStep);
        } else {
          card.currentState = "review";
          card.learningStepIndex = 0;
          card.intervalDays = Math.max(
            srsConfig.minIntervalDays,
            srsConfig.lapseIntervalDays,
          );
          card.nextReviewAt = ensureCooldown(
            addDays(now, card.intervalDays),
          );
        }
        break;
      }
      case "easy": {
        card.easyCount = (card.easyCount || 0) + 1;
        ease = clampEase(ease + srsConfig.easeStepUpEasy / 2);
        interval = Math.max(
          srsConfig.minIntervalDays,
          Math.round((card.intervalDays || 1) * srsConfig.goodMultiplier),
        );
        card.intervalDays = interval;
        card.currentState = "review";
        card.learningStepIndex = 0;
        card.nextReviewAt = ensureCooldown(addDays(now, interval));
        break;
      }
      default:
        break;
    }
  } else {
    switch (rating) {
      case "again": {
        card.againCount = (card.againCount || 0) + 1;
        card.lapseCount = (card.lapseCount || 0) + 1;
        ease = clampEase(ease - srsConfig.easeStepDownHard);
        scheduleRelearningStep(0);
        break;
      }
      case "hard": {
        card.hardCount = (card.hardCount || 0) + 1;
        ease = clampEase(ease - srsConfig.easeStepDownHard);
        interval = Math.max(
          srsConfig.minIntervalDays,
          Math.round(interval * srsConfig.hardMultiplier),
        );
        card.intervalDays = interval;
        card.currentState = "review";
        card.learningStepIndex = 0;
        card.nextReviewAt = ensureCooldown(addDays(now, interval));
        break;
      }
      case "good": {
        card.goodCount = (card.goodCount || 0) + 1;
        interval = Math.max(
          srsConfig.minIntervalDays,
          Math.round(interval * srsConfig.goodMultiplier),
        );
        card.intervalDays = interval;
        card.currentState = "review";
        card.learningStepIndex = 0;
        card.nextReviewAt = ensureCooldown(addDays(now, interval));
        break;
      }
      case "easy": {
        card.easyCount = (card.easyCount || 0) + 1;
        ease = clampEase(ease + srsConfig.easeStepUpEasy);
        interval = Math.max(
          srsConfig.minIntervalDays,
          Math.round(interval * srsConfig.easyMultiplier),
        );
        card.intervalDays = interval;
        card.currentState = "review";
        card.learningStepIndex = 0;
        card.nextReviewAt = ensureCooldown(addDays(now, interval));
        break;
      }
      default:
        break;
    }
  }

  card.easeFactor = clampEase(ease);
  card.lastReviewedAt = now;
  card.reviewCount = (card.reviewCount || 0) + 1;

  // Safety net: if no schedule was set (should not happen), ensure a minimal delay.
  if (!card.nextReviewAt) {
    card.nextReviewAt = ensureCooldown(addDays(now, srsConfig.minIntervalDays));
  }

  if (typeof data.responseTimeMs === "number") {
    const prevCount = Math.max((card.reviewCount || 1) - 1, 0);
    const prevAvg = card.averageResponseTime || 0;
    const newAvg =
      prevCount === 0
        ? data.responseTimeMs
        : Math.round(
            (prevAvg * prevCount + data.responseTimeMs) / (prevCount + 1)
          );
    card.averageResponseTime = newAvg;
  }

  await card.save();

  const plain = card.toObject();
  return { ...plain, stalenessStatus: computeStalenessStatus(plain) };
};
