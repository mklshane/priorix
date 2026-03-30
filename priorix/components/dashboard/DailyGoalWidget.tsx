"use client";

import { Target } from "lucide-react";
import { useRouter } from "next/navigation";

interface DailyGoalProgress {
  reviewed: number;
  goal: number;
  percentage: number;
  status: "complete" | "on_track" | "behind";
}

interface DailyGoalWidgetProps {
  progress: DailyGoalProgress;
}

export default function DailyGoalWidget({ progress }: DailyGoalWidgetProps) {
  const router = useRouter();
  const { reviewed, goal, percentage, status } = progress;

  const barColor =
    status === "complete"
      ? "bg-mint"
      : status === "on_track"
      ? "bg-mint"
      : percentage < 25
      ? "bg-tangerine"
      : "bg-citrus";

  const label =
    status === "complete"
      ? "Goal complete!"
      : `${goal - reviewed} card${goal - reviewed !== 1 ? "s" : ""} to go`;

  return (
    <div
      className="bento-card bg-card border-2 border-border p-5 cursor-pointer hover:shadow-bento transition-all"
      onClick={() => router.push("/decks")}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-citrus border-2 border-border flex items-center justify-center shrink-0">
          <Target className="w-4 h-4 text-foreground" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Daily Goal
          </p>
          <p className="text-sm font-bold text-foreground">{label}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-foreground">
            {reviewed} / {goal} cards
          </span>
          <span className="text-muted-foreground">{percentage}%</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border/30">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
