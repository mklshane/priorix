import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, TrendingUp, Clock } from "lucide-react";

interface DeckPerformanceProps {
  decks: Array<{
    deckId: string;
    deckTitle: string;
    totalCards: number;
    averageRetention: number;
    averageDifficulty: number;
    cardsMastered: number;
    sessionsCompleted: number;
  }>;
}

export default function DeckPerformance({ decks }: DeckPerformanceProps) {
  const colors = ["bg-purple/20", "bg-pink/20", "bg-yellow/20", "bg-perry/20"];
  
  return (
    <Card className="bg-purple/20 dark:bg-card border-2 border-black dark:border-darkborder rounded-xl">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 font-sora">Deck Performance</h3>
        {decks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 font-sora">
            No deck activity yet
          </p>
        ) : (
          <div className="space-y-3">
            {decks.slice(0, 10).map((deck, index) => (
              <div
                key={deck.deckId}
                className={`p-4 border-2 border-black/10 dark:border-darkborder rounded-xl ${colors[index % colors.length]} hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1 font-sora">{deck.deckTitle}</h4>
                    <p className="text-xs text-muted-foreground">
                      {deck.sessionsCompleted} sessions completed
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Retention</p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-sm font-semibold font-sora">
                        {deck.averageRetention}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Mastered</p>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-3 w-3" />
                      <span className="text-sm font-semibold font-sora">
                        {deck.cardsMastered}/{deck.totalCards}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-sm font-semibold font-sora">
                        {deck.averageDifficulty}/10
                      </span>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-2 bg-background dark:bg-gray-700 rounded-full overflow-hidden border border-black/10 dark:border-darkborder">
                    <div
                      className="h-full bg-green dark:bg-green/80 rounded-full transition-all"
                      style={{
                        width: `${(deck.cardsMastered / deck.totalCards) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
