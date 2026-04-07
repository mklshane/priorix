"use client";

import { BarChart3, BookOpen, Brain, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DeckSrsPerformance {
  sessions: number;
  recallRate: number;
  cardsReviewed: number;
}

interface DeckQuizPerformance {
  sessions: number;
  averageScore: number;
  latestScore: number | null;
}

interface RecentDeckPerformance {
  deckId: string;
  deckTitle: string;
  lastStudiedAt: string;
  windowDays: number;
  hasSrs: boolean;
  hasQuiz: boolean;
  srs: DeckSrsPerformance | null;
  quiz: DeckQuizPerformance | null;
}

interface RecentDeckPerformanceInsightProps {
  performance: RecentDeckPerformance | null;
}

export default function RecentDeckPerformanceInsight({
  performance,
}: RecentDeckPerformanceInsightProps) {
  if (!performance) {
    return (
      <div className="bento-card bg-muted/30 border-dashed p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-background border-2 border-border flex items-center justify-center">
            <BookOpen className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-editorial italic">Recent Deck Performance</h3>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          No recent deck study data yet. Complete a study session to see deck-level SRS and quiz performance.
        </p>
      </div>
    );
  }

  return (
    <div className="bento-card bg-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-sky border-2 border-border flex items-center justify-center shadow-sm">
          <BarChart3 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-lg font-editorial italic">Recent Deck Performance</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Last {performance.windowDays} days
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl border-2 border-border bg-muted/30 mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Most Recent Deck Studied
        </p>
        <p className="text-base font-bold leading-tight">{performance.deckTitle}</p>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Last studied {formatDistanceToNow(new Date(performance.lastStudiedAt), { addSuffix: true })}
        </p>
      </div>

      <div className="space-y-3">
        {performance.srs && (
          <div className="rounded-2xl border-2 border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-widest">SRS Performance</p>
            </div>
            <p className="text-sm font-medium text-foreground/85">
              {performance.srs.recallRate}% recall rate across {performance.srs.sessions} session{performance.srs.sessions === 1 ? "" : "s"} and {performance.srs.cardsReviewed} cards reviewed.
            </p>
          </div>
        )}

        {performance.quiz && (
          <div className="rounded-2xl border-2 border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-widest">Quiz Performance</p>
            </div>
            <p className="text-sm font-medium text-foreground/85">
              {performance.quiz.averageScore}% average across {performance.quiz.sessions} quiz session{performance.quiz.sessions === 1 ? "" : "s"}
              {performance.quiz.latestScore !== null ? ` (latest ${performance.quiz.latestScore}%)` : ""}.
            </p>
          </div>
        )}

        {!performance.srs && !performance.quiz && (
          <div className="rounded-2xl border-2 border-border bg-background p-4">
            <p className="text-sm font-medium text-muted-foreground">
              No SRS or quiz results were recorded for this deck in the selected window.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
