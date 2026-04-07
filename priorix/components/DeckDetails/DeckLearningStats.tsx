"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import QuizPerformance from "@/components/analytics/QuizPerformance";

interface DeckLearningStatsProps {
  quizSessions: {
    quizScore: number;
    quizType?: string;
    cardsReviewed: number;
    sessionStart: string;
  }[];
}

const DeckLearningStats = ({ quizSessions }: DeckLearningStatsProps) => {
  const [open, setOpen] = useState(false);

  if (quizSessions.length === 0) return null;

  return (
    <div className="my-8">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 border-black dark:border-darkborder bg-card hover:-translate-y-0.5 hover:shadow-bento-sm transition-all duration-200"
      >
        <span className="text-base font-bold font-sora">Quiz Performance</span>
        <ChevronDown
          className={`h-5 w-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-4">
          <QuizPerformance quizSessions={quizSessions} />
        </div>
      )}
    </div>
  );
};

export default DeckLearningStats;
