"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface AtRiskDeck {
  deckId: string;
  title: string;
  atRiskCount: number;
}

interface RetentionRiskWidgetProps {
  totalAtRisk: number;
  atRiskDecks: AtRiskDeck[];
}

export default function RetentionRiskWidget({
  totalAtRisk,
  atRiskDecks,
}: RetentionRiskWidgetProps) {
  const router = useRouter();

  if (totalAtRisk === 0) return null;

  const topDecks = atRiskDecks.slice(0, 3);

  const handleReviewAtRisk = (deckId: string) => {
    router.push(`/decks/${deckId}/study-srs?atRisk=true`);
  };

  return (
    <div className="bento-card bg-blush border-2 border-border p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">
            {totalAtRisk} card{totalAtRisk !== 1 ? "s" : ""} at risk of being forgotten
          </p>
          <p className="text-xs text-foreground/70 mt-0.5">
            {topDecks.map((d) => `${d.title} (${d.atRiskCount})`).join(" · ")}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {topDecks.map((deck) => (
          <button
            key={deck.deckId}
            onClick={() => handleReviewAtRisk(deck.deckId)}
            className="w-full flex items-center justify-between gap-2 text-xs font-bold text-foreground bg-background/60 hover:bg-background/80 border border-border/40 rounded-xl px-3 py-2 transition-colors group"
          >
            <span className="truncate">{deck.title}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-foreground/60">{deck.atRiskCount} at risk</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
