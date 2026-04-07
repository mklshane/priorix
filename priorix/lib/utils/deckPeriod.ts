export interface DeckPeriodStatus {
  label: string;
  colorClass: string;
}

function fmt(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getDeckPeriodStatus(
  studyPeriodStart?: string,
  studyPeriodEnd?: string
): DeckPeriodStatus | null {
  if (!studyPeriodStart && !studyPeriodEnd) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (studyPeriodEnd) {
    const end = new Date(studyPeriodEnd);
    end.setHours(0, 0, 0, 0);

    // Check if we haven't started yet (only relevant when start is also set)
    if (studyPeriodStart) {
      const start = new Date(studyPeriodStart);
      start.setHours(0, 0, 0, 0);
      if (today < start) {
        return { label: `Starts ${fmt(start)}`, colorClass: "bg-lilac" };
      }
    }

    // Past due
    if (today > end) {
      return { label: `Past due ${fmt(end)}`, colorClass: "bg-blush" };
    }

    // Active — compute days remaining
    const daysRemaining = Math.round(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysRemaining <= 7) {
      return {
        label: daysRemaining === 0 ? "Due today" : `Due in ${daysRemaining}d`,
        colorClass: "bg-citrus",
      };
    }
    return { label: `Due ${fmt(end)}`, colorClass: "bg-lilac" };
  }

  // Only start date set
  const start = new Date(studyPeriodStart!);
  start.setHours(0, 0, 0, 0);
  if (today < start) {
    return { label: `Starts ${fmt(start)}`, colorClass: "bg-lilac" };
  }
  return { label: `Active since ${fmt(start)}`, colorClass: "bg-mint" };
}
