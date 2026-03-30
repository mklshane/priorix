"use client";

import { BookOpen, Zap, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeckDueInfo {
  deckId: string;
  title: string;
  dueCount: number;
  overdueCount: number;
  urgencyScore: number;
}

interface StudyQueueWidgetProps {
  decks: DeckDueInfo[];
  isLoading?: boolean;
}

export default function StudyQueueWidget({ decks, isLoading }: StudyQueueWidgetProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="bento-card bg-card border-2 border-border p-5 animate-pulse">
        <div className="h-5 bg-muted rounded w-1/3 mb-4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-muted rounded-xl mb-2"></div>
        ))}
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="bento-card bg-mint border-2 border-border p-5 flex flex-col items-center justify-center text-center min-h-[140px]">
        <BookOpen className="w-6 h-6 text-foreground/60 mb-2" />
        <p className="text-sm font-bold text-foreground">All caught up!</p>
        <p className="text-xs text-foreground/60 mt-1">No cards due right now.</p>
      </div>
    );
  }

  const topDecks = decks.slice(0, 3);

  return (
    <div className="bento-card bg-card border-2 border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-foreground" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
          Study Queue
        </h3>
      </div>

      <div className="space-y-2">
        {topDecks.map((deck) => (
          <div
            key={deck.deckId}
            className="flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-border bg-background hover:bg-muted/30 cursor-pointer transition-colors group"
            onClick={() => router.push(`/decks/${deck.deckId}/study-srs`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{deck.title}</p>
              <div className="flex gap-1.5 mt-0.5">
                {deck.overdueCount > 0 && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-foreground bg-blush px-1.5 py-0.5 rounded-full border border-border/30">
                    {deck.overdueCount} overdue
                  </span>
                )}
                {deck.dueCount - deck.overdueCount > 0 && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-foreground bg-citrus px-1.5 py-0.5 rounded-full border border-border/30">
                    {deck.dueCount - deck.overdueCount} due
                  </span>
                )}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
