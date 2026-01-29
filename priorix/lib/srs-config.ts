export const srsConfig = {
  scope: "global" as const,
  startingEase: 2.5,
  minEase: 1.3,
  easeStepDownHard: 0.15,
  easeStepUpEasy: 0.15,
  againIntervalDays: 1,
  hardMultiplier: 1.2,
  goodMultiplier: 2.5,
  easyMultiplier: 3.5,
  minIntervalDays: 1,
  // Minimum delay (minutes) before a reviewed card can be selected again, as a safety net.
  minNextReviewMinutes: 10,
};

export const srsSessionSizes = [10, 20, 30, 40, 50] as const;

export const srsRatings = ["again", "hard", "good", "easy"] as const;
export type SrsRating = (typeof srsRatings)[number];

export const clampEase = (value: number) => Math.max(srsConfig.minEase, value);

export const addDays = (date: Date, days: number) => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};
