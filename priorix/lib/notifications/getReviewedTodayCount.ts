import UserStudySession from "@/lib/models/UserStudySession";
import { getStartOfTodayUTC } from "./getDateKey";

/**
 * Returns the total number of cards the user has reviewed today (UTC).
 * Sums cardsReviewed across all study sessions that started today.
 */
export async function getReviewedTodayCount(userId: string): Promise<number> {
  const startOfToday = getStartOfTodayUTC();

  const result = await UserStudySession.aggregate([
    {
      $match: {
        userId: { $eq: userId },
        sessionStart: { $gte: startOfToday },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$cardsReviewed" },
      },
    },
  ]);

  return result[0]?.total ?? 0;
}
