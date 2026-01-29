import { ConnectDB } from "@/lib/config/db";
import Flashcard from "@/lib/models/Flashcard";
import { addDays, clampEase, srsConfig } from "@/lib/srs-config";
import type { SrsRating } from "@/lib/srs-config";

const initCardIfNeeded = (card: any) => {
  if (!card.easeFactor) card.easeFactor = srsConfig.startingEase;
  if (!card.intervalDays || card.intervalDays < srsConfig.minIntervalDays) {
    card.intervalDays = srsConfig.minIntervalDays;
  }
  if (!card.currentState) card.currentState = "learning";
  if (card.reviewCount == null) card.reviewCount = 0;
  if (card.againCount == null) card.againCount = 0;
  if (card.hardCount == null) card.hardCount = 0;
  if (card.goodCount == null) card.goodCount = 0;
  if (card.easyCount == null) card.easyCount = 0;
  if (card.averageResponseTime == null) card.averageResponseTime = 0;
  if (card.lastReviewedAt === undefined) card.lastReviewedAt = null;
  if (card.nextReviewAt === undefined) card.nextReviewAt = null;
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

  cards.forEach(initCardIfNeeded);
  return cards;
};

export const reviewFlashcard = async (data: {
  cardId: string;
  rating: SrsRating;
  responseTimeMs?: number;
}) => {
  await ConnectDB();
  const card = await Flashcard.findById(data.cardId);
  if (!card) throw new Error("Flashcard not found");

  initCardIfNeeded(card);

  const now = new Date();
  const rating = data.rating;
  let ease = card.easeFactor || srsConfig.startingEase;
  let interval = card.intervalDays || srsConfig.minIntervalDays;

  switch (rating) {
    case "again": {
      interval = srsConfig.againIntervalDays;
      ease = clampEase(srsConfig.minEase);
      card.againCount = (card.againCount || 0) + 1;
      card.currentState = "relearning";
      break;
    }
    case "hard": {
      interval = Math.max(
        srsConfig.minIntervalDays,
        Math.round(interval * srsConfig.hardMultiplier)
      );
      ease = clampEase(ease - srsConfig.easeStepDownHard);
      card.hardCount = (card.hardCount || 0) + 1;
      card.currentState = "review";
      break;
    }
    case "good": {
      interval = Math.max(
        srsConfig.minIntervalDays,
        Math.round(interval * srsConfig.goodMultiplier)
      );
      card.goodCount = (card.goodCount || 0) + 1;
      card.currentState = "review";
      break;
    }
    case "easy": {
      interval = Math.max(
        srsConfig.minIntervalDays,
        Math.round(interval * srsConfig.easyMultiplier)
      );
      ease = clampEase(ease + srsConfig.easeStepUpEasy);
      card.easyCount = (card.easyCount || 0) + 1;
      card.currentState = "review";
      break;
    }
    default: {
      break;
    }
  }

  card.intervalDays = interval;
  card.easeFactor = ease;
  card.lastReviewedAt = now;
  const scheduled = addDays(now, interval);
  const minNext = new Date(
    now.getTime() + (srsConfig.minNextReviewMinutes || 0) * 60 * 1000,
  );
  card.nextReviewAt = scheduled > minNext ? scheduled : minNext;
  card.reviewCount = (card.reviewCount || 0) + 1;

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
  return card;
};
