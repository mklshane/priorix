import { ConnectDB } from "@/lib/config/db";
import Flashcard from "@/lib/models/Flashcard";
import UserCardProgress from "@/lib/models/UserCardProgress";
import { addDays, clampEase, srsConfig } from "@/lib/srs-config";
import type { SrsRating } from "@/lib/srs-config";

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
  const cooldownMs = (srsConfig.minNextReviewMinutes || 0) * 60 * 1000;
  const recentCutoff = new Date(now.getTime() - cooldownMs);

  if (!userId) throw new Error("userId is required for SRS due fetch");

  const cards = await Flashcard.find({ deck: deckId }).sort({ createdAt: 1 });
  const cardIds = cards.map((c) => c._id);

  const progressMap = new Map<string, any>();

  // Upsert progress per card to avoid duplicate key errors under concurrency
  const ensureProgressPromises = cards.map(async (card) => {
    const prog = await UserCardProgress.findOneAndUpdate(
      { userId, cardId: card._id },
      { $setOnInsert: { deckId: card.deck } },
      { upsert: true, new: true },
    );
    await initProgressIfNeeded(prog, card, userId);
    progressMap.set(String(card._id), prog);
  });

  await Promise.all(ensureProgressPromises);

  const eligible = cards
    .map((card) => {
      const prog = progressMap.get(String(card._id));
      return { card, prog };
    })
    .filter(({ prog }) => !prog.lastReviewedAt || prog.lastReviewedAt < recentCutoff)
    .filter(({ prog }) => !prog.nextReviewAt || prog.nextReviewAt <= now);

  const shuffled = eligible.sort(() => Math.random() - 0.5).slice(0, limit);

  return shuffled.map(({ card, prog }) => {
    const plainCard = card.toObject();
    const plainProg = prog.toObject();
    return {
      ...plainCard,
      ...plainProg,
      _id: plainCard._id, // ensure card id is preserved
      cardId: plainCard._id,
      progressId: plainProg._id,
      stalenessStatus: computeStalenessStatus(prog),
    };
  });
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
  let ease = progress.easeFactor || srsConfig.startingEase;
  let interval = progress.intervalDays ?? srsConfig.minIntervalDays;
  const learningStepIndex = progress.learningStepIndex ?? 0;

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
    progress.learningStepIndex = idx;
    progress.currentState = "learning";
    progress.intervalDays = 0;
    progress.nextReviewAt = ensureCooldown(
      new Date(now.getTime() + minutesToMs(delay)),
    );
  };

  const scheduleRelearningStep = (stepIndex: number) => {
    const steps = srsConfig.relearningStepsMinutes;
    const idx = Math.min(Math.max(stepIndex, 0), steps.length - 1);
    const delay = steps[idx] ?? srsConfig.minIntervalDays * 24 * 60;
    progress.learningStepIndex = idx;
    progress.currentState = "relearning";
    progress.intervalDays = srsConfig.lapseIntervalDays;
    progress.nextReviewAt = ensureCooldown(
      new Date(now.getTime() + minutesToMs(delay)),
    );
  };

  const graduateToReview = (baseIntervalDays: number, easeOverride?: number) => {
    const nextInterval = Math.max(srsConfig.minIntervalDays, baseIntervalDays);
    progress.intervalDays = nextInterval;
    progress.currentState = "review";
    progress.learningStepIndex = 0;
    progress.nextReviewAt = ensureCooldown(addDays(now, nextInterval));
    progress.easeFactor = clampEase(easeOverride ?? ease);
  };

  const state = progress.currentState || "new";

  if (state === "new" || state === "learning") {
    switch (rating) {
      case "again": {
        progress.againCount = (progress.againCount || 0) + 1;
        ease = clampEase(ease - srsConfig.easeStepDownHard);
        scheduleLearningStep(0);
        break;
      }
      case "hard": {
        progress.hardCount = (progress.hardCount || 0) + 1;
        ease = clampEase(ease - srsConfig.easeStepDownHard / 2);
        scheduleLearningStep(Math.max(learningStepIndex, 0));
        break;
      }
      case "good": {
        progress.goodCount = (progress.goodCount || 0) + 1;
        const nextStep = learningStepIndex + 1;
        if (nextStep < srsConfig.learningStepsMinutes.length) {
          scheduleLearningStep(nextStep);
        } else {
          graduateToReview(srsConfig.initialReviewIntervalDays, ease);
        }
        break;
      }
      case "easy": {
        progress.easyCount = (progress.easyCount || 0) + 1;
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
        progress.againCount = (progress.againCount || 0) + 1;
        scheduleRelearningStep(0);
        break;
      }
      case "hard": {
        progress.hardCount = (progress.hardCount || 0) + 1;
        scheduleRelearningStep(Math.max(learningStepIndex, 0));
        break;
      }
      case "good": {
        progress.goodCount = (progress.goodCount || 0) + 1;
        const nextStep = learningStepIndex + 1;
        if (nextStep < srsConfig.relearningStepsMinutes.length) {
          scheduleRelearningStep(nextStep);
        } else {
          progress.currentState = "review";
          progress.learningStepIndex = 0;
          progress.intervalDays = Math.max(
            srsConfig.minIntervalDays,
            srsConfig.lapseIntervalDays,
          );
          progress.nextReviewAt = ensureCooldown(
            addDays(now, progress.intervalDays),
          );
        }
        break;
      }
      case "easy": {
        progress.easyCount = (progress.easyCount || 0) + 1;
        ease = clampEase(ease + srsConfig.easeStepUpEasy / 2);
        interval = Math.max(
          srsConfig.minIntervalDays,
          Math.round((progress.intervalDays || 1) * srsConfig.goodMultiplier),
        );
        progress.intervalDays = interval;
        progress.currentState = "review";
        progress.learningStepIndex = 0;
        progress.nextReviewAt = ensureCooldown(addDays(now, interval));
        break;
      }
      default:
        break;
    }
  } else {
    switch (rating) {
      case "again": {
        progress.againCount = (progress.againCount || 0) + 1;
        progress.lapseCount = (progress.lapseCount || 0) + 1;
        ease = clampEase(ease - srsConfig.easeStepDownHard);
        scheduleRelearningStep(0);
        break;
      }
      case "hard": {
        progress.hardCount = (progress.hardCount || 0) + 1;
        ease = clampEase(ease - srsConfig.easeStepDownHard);
        interval = Math.max(
          srsConfig.minIntervalDays,
          Math.round(interval * srsConfig.hardMultiplier),
        );
        progress.intervalDays = interval;
        progress.currentState = "review";
        progress.learningStepIndex = 0;
        progress.nextReviewAt = ensureCooldown(addDays(now, interval));
        break;
      }
      case "good": {
        progress.goodCount = (progress.goodCount || 0) + 1;
        interval = Math.max(
          srsConfig.minIntervalDays,
          Math.round(interval * srsConfig.goodMultiplier),
        );
        progress.intervalDays = interval;
        progress.currentState = "review";
        progress.learningStepIndex = 0;
        progress.nextReviewAt = ensureCooldown(addDays(now, interval));
        break;
      }
      case "easy": {
        progress.easyCount = (progress.easyCount || 0) + 1;
        ease = clampEase(ease + srsConfig.easeStepUpEasy);
        interval = Math.max(
          srsConfig.minIntervalDays,
          Math.round(interval * srsConfig.easyMultiplier),
        );
        progress.intervalDays = interval;
        progress.currentState = "review";
        progress.learningStepIndex = 0;
        progress.nextReviewAt = ensureCooldown(addDays(now, interval));
        break;
      }
      default:
        break;
    }
  }

  progress.easeFactor = clampEase(ease);
  progress.lastReviewedAt = now;
  progress.reviewCount = (progress.reviewCount || 0) + 1;

  if (!progress.nextReviewAt) {
    progress.nextReviewAt = ensureCooldown(addDays(now, srsConfig.minIntervalDays));
  }

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
