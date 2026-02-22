export const srsConfig = {
  scope: "global" as const,
  startingEase: 2.5,
  minEase: 1.3,
  /**
   * @deprecated The adaptive SRS (lib/adaptive-srs.ts) uses per-learning-speed
   * settings instead of these fixed multipliers. Kept as fallback defaults for
   * initProgressIfNeeded() migration seeding only.
   */
  easeStepDownHard: 0.15,
  /** @deprecated See above */ easeStepUpEasy: 0.15,
  /** @deprecated See above */ againIntervalDays: 1,
  /** @deprecated See above */ hardMultiplier: 1.2,
  /** @deprecated See above */ goodMultiplier: 2.5,
  /** @deprecated See above */ easyMultiplier: 3.5,
  minIntervalDays: 1,
  learningStepsMinutes: [10, 60 * 24],
  relearningStepsMinutes: [10, 60 * 24],
  /** @deprecated See above */ initialReviewIntervalDays: 4,
  /** @deprecated See above */ easyGraduatingIntervalDays: 6,
  /** @deprecated See above */ lapseIntervalDays: 1,
  // Minimum delay (minutes) before a reviewed card can be selected again, as a safety net.
  minNextReviewMinutes: 10,
};

export const srsSessionSizes = [10, 20, 30, 40] as const;

export const srsRatings = ["again", "hard", "good", "easy"] as const;
export type SrsRating = (typeof srsRatings)[number];

export const clampEase = (value: number) => Math.max(srsConfig.minEase, value);

export const addDays = (date: Date, days: number) => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};
