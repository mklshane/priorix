"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Check, Clock, RotateCcw, Target, Zap } from "lucide-react";

import LoadingState from "@/components/DeckDetails/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useDeck } from "@/hooks/useDeck";
import { useFlashcards } from "@/hooks/useFlashcards";
import { useSrsStudy } from "@/hooks/useSrsStudy";
import { useToast } from "@/hooks/useToast";
import { useStudySession } from "@/hooks/useStudySession";
import { SrsRating, srsRatings, srsSessionSizes } from "@/lib/srs-config";
import { cn } from "@/lib/utils";
import { IFlashcard } from "@/types/flashcard";

const sessionSizeStorageKey = (deckId: string) => `srs-session-size-${deckId}`;

type RoundStats = Record<SrsRating, number>;

type SummaryBuckets = {
  notYet: number;
  forgotten: number;
  learning: number;
  hard: number;
  good: number;
  mastered: number;
};

const defaultStats: RoundStats = {
  again: 0,
  hard: 0,
  good: 0,
  easy: 0,
};

const defaultSummary: SummaryBuckets = {
  notYet: 0,
  forgotten: 0,
  learning: 0,
  hard: 0,
  good: 0,
  mastered: 0,
};

const FORGOTTEN_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;

/** Fisher-Yates shuffle — randomises presentation order so learners can't predict sequence */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Client-side interval preview: estimates what the next review interval
 * would be for each rating, based on the card's current SRS state.
 * Returns a human-readable string like "10m", "1d", "3d", "2w".
 */
function previewInterval(card: IFlashcard, rating: SrsRating): string {
  const state = card.currentState ?? "new";
  const ease = card.easeFactor ?? 2.5;
  const interval = card.intervalDays ?? 0;
  const step = card.learningStepIndex ?? 0;
  const difficulty = card.perceivedDifficulty ?? 5;

  // Difficulty modifier: 1.2 (easy, d=1) to 0.7 (hard, d=10)
  const diffMod = 1.2 - (difficulty - 1) * 0.055;

  const learningSteps = [1, 10]; // minutes (matches adaptive-srs.ts)
  const relearnSteps = [10]; // single relearn step

  let minutes = 0;

  if (state === "new" || state === "learning") {
    if (rating === "again") {
      minutes = learningSteps[0];
    } else if (rating === "hard") {
      minutes = learningSteps[step] ?? learningSteps[learningSteps.length - 1];
    } else {
      const nextStep = step + 1;
      if (nextStep >= learningSteps.length) {
        // Graduates
        const baseInterval = rating === "easy" ? 4 : 1;
        minutes = baseInterval * diffMod * 24 * 60;
      } else {
        minutes = learningSteps[nextStep];
      }
    }
  } else if (state === "review") {
    if (rating === "again") {
      minutes = relearnSteps[0];
    } else {
      let newInterval: number;
      if (rating === "hard") {
        newInterval = interval * 1.2 * diffMod;
      } else if (rating === "good") {
        newInterval = interval * ease * diffMod;
      } else {
        newInterval = interval * ease * 1.3 * diffMod;
      }
      minutes = Math.max(1, newInterval) * 24 * 60;
    }
  } else {
    // relearning
    if (rating === "again") {
      minutes = relearnSteps[0];
    } else if (rating === "hard") {
      minutes = relearnSteps[step] ?? relearnSteps[relearnSteps.length - 1];
    } else {
      const nextStep = step + 1;
      if (nextStep >= relearnSteps.length) {
        const days = Math.max(1, interval * 0.5);
        minutes = days * 24 * 60;
      } else {
        minutes = relearnSteps[nextStep];
      }
    }
  }

  return formatInterval(minutes);
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  const days = minutes / 1440;
  if (days < 7) return `${Math.round(days)}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}

const ratingConfig = {
  again: {
    label: "Again",
    description: "I forgot this card.",
    color: "text-foreground",
    bgColor: "bg-blush hover:bg-blush/90",
    borderColor: "border-border",
    icon: RotateCcw,
  },
  hard: {
    label: "Hard",
    description: "I remembered, but with effort.",
    color: "text-foreground",
    bgColor: "bg-tangerine hover:bg-tangerine/90",
    borderColor: "border-border",
    icon: Target,
  },
  good: {
    label: "Good",
    description: "I remembered easily.",
    color: "text-foreground",
    bgColor: "bg-sky hover:bg-sky/90",
    borderColor: "border-border",
    icon: Check,
  },
  easy: {
    label: "Easy",
    description: "This was very easy.",
    color: "text-foreground",
    bgColor: "bg-mint hover:bg-mint/90",
    borderColor: "border-border",
    icon: Zap,
  },
} as const;

const StudySrsPage = () => {
  const params = useParams();
  const deckId = params.deckId as string;
  const router = useRouter();
  const { showToast } = useToast();

  // Session tracking
  const { recordCardReview, endSession, startSession, sessionQuality } = useStudySession({ 
    deckId,
    enabled: true 
  });

  const [sessionSize, setSessionSize] = useState<number>(() => {
    if (typeof window === "undefined") return 10;
    const raw = window.localStorage.getItem(sessionSizeStorageKey(deckId));
    const parsed = raw ? parseInt(raw, 10) : 10;
    return Number.isNaN(parsed) ? 10 : parsed;
  });

  const [pendingCards, setPendingCards] = useState<IFlashcard[]>([]);
  const [queue, setQueue] = useState<IFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [stats, setStats] = useState<RoundStats>({ ...defaultStats });
  const [hasStartedRound, setHasStartedRound] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [roundTotal, setRoundTotal] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [roundCards, setRoundCards] = useState<IFlashcard[]>([]);
  const [seenCardIds, setSeenCardIds] = useState<Set<string>>(new Set());
  const [cardUpdates, setCardUpdates] = useState<Record<string, IFlashcard>>(
    {},
  );
  const [lastRatings, setLastRatings] = useState<Record<string, SrsRating>>({});

  const { deck, isLoading: isDeckLoading, error: deckError } = useDeck(deckId);
  const { flashcards: deckCards, isLoading: isFlashcardsLoading } =
    useFlashcards(deckId);
  const {
    dueCards,
    isLoading: isDueLoading,
    error: dueError,
    refetchDue,
    review,
    isReviewing,
  } = useSrsStudy(deckId, sessionSize);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      sessionSizeStorageKey(deckId),
      `${sessionSize}`,
    );
  }, [deckId, sessionSize]);

  useEffect(() => {
    if (!hasStartedRound) {
      setPendingCards(dueCards);
      setQueue([]);
      setCurrentIndex(0);
      setIsRevealed(false);
      setCompletionOpen(false);
      setStats({ ...defaultStats });
      setRoundTotal(0);
      setCompletedCount(0);
      setRoundCards(dueCards);
      setSeenCardIds(new Set());
      setLastRatings({});
    }
  }, [dueCards, hasStartedRound]);

  const currentCard = queue[currentIndex];
  const isPending =
    (isDeckLoading && !deck) ||
    (isFlashcardsLoading && deckCards.length === 0) ||
    (isDueLoading &&
      !dueCards.length &&
      !pendingCards.length &&
      !hasStartedRound &&
      !roundCards.length);
  const roundActive = hasStartedRound && queue.length > 0;

  const toggleReveal = useCallback(() => {
    if (!currentCard) return;
    setIsFlipping(true);
    setTimeout(() => {
      setIsRevealed((prev) => !prev);
      setIsFlipping(false);
    }, 150);
  }, [currentCard]);

  const startRound = () => {
    if (pendingCards.length === 0) return;
    // Shuffle so learners can't predict the sequence
    const ordered = shuffle(pendingCards);
    setQueue(ordered);
    setRoundTotal(ordered.length);
    setCompletedCount(0);
    setCurrentIndex(0);
    setIsRevealed(false);
    setCompletionOpen(false);
    setStats({ ...defaultStats });
    setHasStartedRound(true);
    setRoundCards(ordered);
    setSeenCardIds(new Set());
    setLastRatings({});
  };

  const handleRating = async (rating: SrsRating) => {
    if (!currentCard) return;
    try {
      const reviewStartTime = Date.now();
      const updatedCard = await review({ cardId: currentCard._id, rating });
      const responseTime = Date.now() - reviewStartTime;
      
      // Track in session (responseTime in milliseconds)
      recordCardReview(rating, responseTime);
      
      setSeenCardIds((prev) => {
        const next = new Set(prev);
        next.add(currentCard._id);
        return next;
      });
      setLastRatings((prev) => ({ ...prev, [currentCard._id]: rating }));
      if (updatedCard) {
        setCardUpdates((prev) => ({ ...prev, [updatedCard._id]: updatedCard }));
      }
      setStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
      setCompletedCount((prev) => prev + 1);

      const nextQueue = queue.filter((_, idx) => idx !== currentIndex);
      if (nextQueue.length === 0) {
        setQueue([]);
        setCompletionOpen(true);
        // End session when round completes
        await endSession();
      } else {
        setQueue(nextQueue);
        setCurrentIndex((prevIdx) =>
          prevIdx >= nextQueue.length ? 0 : prevIdx,
        );
        setIsRevealed(false);
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to record review",
        "error",
      );
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!roundActive || !currentCard) return;
      const active = document.activeElement as HTMLElement | null;
      const isInput =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable);
      if (isInput) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggleReveal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [roundActive, currentCard, toggleReveal]);

  const handleContinue = async () => {
    // End the current session if there was one
    if (hasStartedRound && completedCount > 0) {
      await endSession();
    }
    
    // Fetch new cards and start a new session
    const result = await refetchDue();
    const nextCards = (result.data || []) as IFlashcard[];
    
    // Start new session if there are cards to study
    if (nextCards.length > 0) {
      startSession();
    }
    
    setQueue(shuffle(nextCards));
    setPendingCards(nextCards);
    setRoundTotal(nextCards.length);
    setCompletedCount(0);
    setCurrentIndex(0);
    setIsRevealed(false);
    setCompletionOpen(false);
    setStats({ ...defaultStats });
    setHasStartedRound(nextCards.length > 0);
    setRoundCards(nextCards);
    setSeenCardIds(new Set());
    setLastRatings({});
  };

  const exitToChooser = useCallback(async () => {
    // End session before resetting
    if (hasStartedRound && completedCount > 0) {
      await endSession();
    }
    setQueue([]);
    setRoundTotal(0);
    setCompletedCount(0);
    setCurrentIndex(0);
    setIsRevealed(false);
    setCompletionOpen(false);
    setHasStartedRound(false);
    setStats({ ...defaultStats });
    setRoundCards(dueCards);
    setPendingCards(dueCards);
    setSeenCardIds(new Set());
    setLastRatings({});
  }, [dueCards, hasStartedRound, completedCount, endSession]);

  const handleBackToDeck = async () => {
    if (hasStartedRound) {
      await exitToChooser();
      return;
    }
    router.push(`/decks/${deckId}`);
  };

  const progress =
    roundTotal > 0 ? Math.min((completedCount / roundTotal) * 100, 100) : 0;
  const cardsRemaining = Math.max(roundTotal - completedCount, 0);
  const cardPosition = currentCard
    ? Math.min(completedCount + 1, roundTotal)
    : roundTotal;

 const classifyCard = useCallback(
   (card: IFlashcard): Exclude<keyof SummaryBuckets, "notYet" | "forgotten"> => {
     // Ensure all fields have defaults
     const ease = card.easeFactor ?? 2.5;
     const interval = card.intervalDays ?? 0;
     const reps = card.reviewCount ?? 0;
     const lapses = card.lapseCount ?? card.againCount ?? 0;
     const state = card.currentState ?? "new";
     const lastRating = lastRatings[card._id];

     // Learning: Cards still in learning phase OR just rated "Again"
     const inLearningState =
       state === "new" || state === "learning" || state === "relearning";
     if (inLearningState || lastRating === "again") {
       return "learning";
     }

     // Mastered criteria: Long-term stable memory (more achievable)
     // interval ≥ 14 days, reps ≥ 4, decent ease, few lapses
     const isMastered =
       interval >= 14 && reps >= 4 && ease >= 2.2 && lapses <= 3;
     if (isMastered) {
       return "mastered";
     }

     // Hard cards: Showing signs of difficulty
     // Low ease OR many lapses OR just rated "Hard"
     // Note: Removed interval check - short intervals are normal for new graduates
     const isHard =
       ease < 2.0 || lapses >= 3 || lastRating === "hard";
     if (isHard) {
       return "hard";
     }

     // Good cards: Graduated and progressing well
     // Includes cards with intervals 1-13 days that aren't struggling
     return "good";
   },
   [lastRatings],
 );

  const summarySourceCards = useMemo(() => {
    if (deckCards && deckCards.length > 0) return deckCards;
    if (roundCards.length > 0) return roundCards;
    if (pendingCards.length > 0) return pendingCards;
    return dueCards;
  }, [deckCards, roundCards, pendingCards, dueCards]);

  const deckCardsWithUpdates = useMemo(() => {
    const source = summarySourceCards;
    const merged = new Map<string, IFlashcard>();
    source.forEach((card) => merged.set(card._id, card));
    Object.values(cardUpdates).forEach((card) => merged.set(card._id, card));
    return Array.from(merged.values());
  }, [cardUpdates, summarySourceCards]);

  const computeSummary = useCallback(
    (cards: IFlashcard[]) => {
      return cards.reduce<SummaryBuckets>(
        (acc, card) => {
          const reps = card.reviewCount ?? 0;
          const lastReviewed = card.lastReviewedAt
            ? new Date(card.lastReviewedAt)
            : null;
          const hasBeenReviewed = lastReviewed != null;

          // Never touched
          if (reps === 0 && !hasBeenReviewed) {
            acc.notYet += 1;
            return acc;
          }

          // Forgotten: no review in the last 14 days (or missing timestamp)
          const isForgotten = !lastReviewed
            ? true
            : Date.now() - lastReviewed.getTime() >= FORGOTTEN_THRESHOLD_MS;
          if (isForgotten) {
            acc.forgotten += 1;
            return acc;
          }

          // Otherwise classify by SRS state
          const bucket = classifyCard(card);
          acc[bucket] += 1;
          return acc;
        },
        { ...defaultSummary },
      );
    },
    [classifyCard],
  );

  const roundSummary = useMemo(
    () => computeSummary(deckCardsWithUpdates),
    [computeSummary, deckCardsWithUpdates],
  );

  const preRoundSummary = useMemo(
    () => computeSummary(deckCardsWithUpdates),
    [computeSummary, deckCardsWithUpdates],
  );

  // Count new vs review cards in the current pending set
  const pendingNewCount = useMemo(
    () =>
      pendingCards.filter(
        (c) => c.currentState === "new" && (c.reviewCount ?? 0) === 0,
      ).length,
    [pendingCards],
  );
  const pendingReviewCount = pendingCards.length - pendingNewCount;

  const renderPreRound = () => (
    <div className="min-h-[100dvh] md:min-h-[calc(100dvh-5rem)] p-4 md:p-6 bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col pb-4 h-full justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2 max-w-3xl mx-auto w-full"
        >
          {/* Header Section */}
          <div className="space-y-1">
            
            <div className="hidden md:block bg-citrus dark:bg-citrus rounded-md p-4 border-2 border-border shadow-0 text-foreground">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-background border-2 border-border flex items-center justify-center">
                    <Zap className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-black/70 dark:text-black/70">Ready to study</p>
                    <p className="text-2xl font-editorial italic text-black dark:text-black">{pendingCards.length}</p>
                    {pendingCards.length > 0 && (
                      <p className="text-xs text-black/60 dark:text-black/60 font-medium">
                        {pendingReviewCount} review{pendingReviewCount !== 1 ? "s" : ""}
                        {pendingNewCount > 0 && (
                          <> + {pendingNewCount} new</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={startRound}
                  disabled={isReviewing || pendingCards.length === 0}
                  className="btn-primary flex items-center gap-2 px-6 py-3"
                >
                  <Zap className="h-5 w-5" />
                  STUDY NOW
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Column: Session Settings */}
            <div className="md:col-span-2 space-y-3">
              <Card className="border-2 border-border shadow-bento-sm bento-card">
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold font-editorial flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          Session Size
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Pick your goal</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Choose how many cards you want to study in this session
                      </p>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
                      {srsSessionSizes.map((size) => (
                        <motion.div
                          key={size}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="relative"
                        >
                          <button
                            onClick={() => setSessionSize(size)}
                            disabled={roundActive || isReviewing}
                            className={cn(
                              "w-full h-15 flex flex-col gap-0 transition-all duration-200 rounded-md border-2",
                              sessionSize === size
                                ? "bg-tangerine border-border text-foreground -translate-y-1"
                                : "border-border bg-card hover:-translate-y-0.5"
                            )}
                          >
                            <span className="text-lg font-bold">{size}</span>
                            <span className="text-xs opacity-90 font-bold uppercase tracking-widest">cards</span>
                            {sessionSize === size && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center border-2 border-border">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    
                  </div>
                </CardContent>
              </Card>

              {/* Progress Stats */}
              <Card className="border-2 border-border shadow-bento-sm bento-card">
                <CardContent>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Learning Progress
                  </h2>

                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Overall Mastery</span>
                        <span className="font-bold">
                          {Math.round(
                            ((deckCardsWithUpdates.length -
                              preRoundSummary.notYet) /
                              deckCardsWithUpdates.length) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden border-2 border-border/20">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${((deckCardsWithUpdates.length - preRoundSummary.notYet) / deckCardsWithUpdates.length) * 100}%`,
                          }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-foreground rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{preRoundSummary.notYet} not studied</span>
                        <span>
                          {deckCardsWithUpdates.length - preRoundSummary.notYet}{" "}
                          in progress
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-1">
                      <div className="bg-citrus rounded-md p-3 text-center border-2 border-border">
                        <div className="text-2xl font-bold font-editorial text-foreground">
                          {preRoundSummary.learning}
                        </div>
                        <div className="text-xs uppercase tracking-widest font-bold text-foreground/70 font-sans mt-0.5">
                          Learning
                        </div>
                      </div>
                      <div className="bg-mint rounded-md p-3 text-center border-2 border-border">
                        <div className="text-2xl font-bold font-editorial text-foreground">
                          {preRoundSummary.mastered}
                        </div>
                        <div className="text-xs uppercase tracking-widest font-bold text-foreground/70 font-sans mt-0.5">
                          Mastered
                        </div>
                      </div>
                      <div className="bg-blush rounded-md p-3 text-center border-2 border-border">
                        <div className="text-2xl font-bold font-editorial text-foreground">
                          {preRoundSummary.hard}
                        </div>
                        <div className="text-xs uppercase tracking-widest font-bold text-foreground/70 font-sans mt-0.5">
                          Hard
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Status Overview */}
            <div className="space-y-6 mb-15">
              <Card className="bento-card p-0 py-2">
                <CardContent>
                  <div className="space-y-2 flex flex-col">
                    <div>
                      <h2 className="text-xl font-bold font-editorial flex items-center gap-2">
                        <Check className="h-5 w-5 text-foreground" />
                        Status Overview
                      </h2>
                    </div>

                    <div className="space-y-2 pt-2">
                      {/* Not Yet Studied */}
                      <div className="flex items-center justify-between p-3 rounded-md bg-background border-2 border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md border-2 border-border bg-card flex items-center justify-center">
                            <Clock className="h-4 w-4 text-foreground/70" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Not Yet</p>
                            <p className="text-xs text-muted-foreground">
                              Never reviewed
                            </p>
                          </div>
                        </div>
                        <div className="text-xl font-editorial font-bold">
                          {preRoundSummary.notYet}
                        </div>
                      </div>

                      {/* Learning */}
                      <div className="flex items-center justify-between p-3 rounded-md bg-citrus border-2 border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-background border-2 border-border flex items-center justify-center">
                            <RotateCcw className="h-4 w-4 text-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-black/70 dark:text-black/70">Learning</p>
                            <p className="text-xs text-black/60 dark:text-black/60 font-medium">
                              In learning steps
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold font-editorial text-foreground">
                          {preRoundSummary.learning}
                        </div>
                      </div>

                      {/* Hard */}
                      <div className="flex items-center justify-between p-3 rounded-md bg-blush border-2 border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-background border-2 border-border flex items-center justify-center">
                            <Target className="h-4 w-4 text-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-black/70 dark:text-black/70">Hard</p>
                            <p className="text-xs text-black/60 dark:text-black/60 font-medium">
                              Unstable memory
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold font-editorial text-foreground">
                          {preRoundSummary.hard}
                        </div>
                      </div>

                      {/* Good */}
                      <div className="flex items-center justify-between p-3 rounded-md bg-sky border-2 border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-background border-2 border-border flex items-center justify-center">
                            <Check className="h-4 w-4 text-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-black/70 dark:text-black/70">Good</p>
                            <p className="text-xs text-black/60 dark:text-black/60 font-medium">
                              Progressing well
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold font-editorial text-foreground">
                          {preRoundSummary.good}
                        </div>
                      </div>

                      {/* Mastered */}
                      <div className="flex items-center justify-between p-3 rounded-md bg-mint border-2 border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-background border-2 border-border flex items-center justify-center">
                            <Zap className="h-4 w-4 text-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-black/70 dark:text-black/70">Mastered</p>
                            <p className="text-xs text-black/60 dark:text-black/60 font-medium">
                              Long-term retention
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold font-editorial text-foreground">
                          {preRoundSummary.mastered}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile Action Footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t-2 border-border p-4 sm:hidden">
            <div className="max-w-4xl mx-auto space-y-1">
              {pendingCards.length > 0 && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-center text-muted-foreground pb-1">
                  {pendingReviewCount} review{pendingReviewCount !== 1 ? "s" : ""}
                  {pendingNewCount > 0 && (
                    <> + {pendingNewCount} new</>
                  )}
                </p>
              )}
              <button
                onClick={startRound}
                disabled={isReviewing || pendingCards.length === 0}
                className="w-full btn-primary bg-citrus hover:bg-citrus border-2 border-border text-foreground shadow-bento py-4"
              >
                <Zap className="h-5 w-5" />
                START STUDYING {sessionSize} CARDS
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  if (isPending) return <LoadingState />;

  if (deckError || dueError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md border-2 border-destructive/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <Target className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Study Session Error</h2>
              <p className="text-muted-foreground">
                {deckError || dueError || "Failed to load study data."}
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">Deck not found.</p>
            <Button onClick={handleBackToDeck} variant="outline">
              Back to decks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasStartedRound) return renderPreRound();

  return (
    <div className="min-h-[100dvh] md:min-h-[calc(100dvh-5rem)] flex flex-col pt-4 bg-gradient-to-br from-background via-background to-primary/5 px-2">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col pb-4 h-full justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {roundTotal > 0 && currentCard
                      ? `Card ${cardPosition} of ${roundTotal}`
                      : "Round complete"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold uppercase tracking-widest text-foreground">
                  {Math.round(progress)}% Complete
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {cardsRemaining} cards remaining
                </div>
              </div>
              <div className="w-24 border-2 border-border/20 rounded-full h-3 overflow-hidden bg-muted flex items-center">
                <div className="h-full bg-foreground" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard ? currentCard._id : "completed"}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-h-[50vh] md:min-h-[60vh] relative mb-6"
          >
            <div
              onClick={toggleReveal}
              className={cn(
                "absolute inset-0 border-2 border-border shadow-bento rounded-xl p-6 md:p-10 flex flex-col transition-all duration-300 ease-out cursor-pointer bg-card overflow-y-auto",
                isFlipping && "transform-gpu",
              )}
            >
              <div className="flex-1 w-full flex flex-col">
                {currentCard ? (
                  <>
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={isRevealed ? "answer" : "question"}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6 w-full"
                        >
                          <div
                            className={cn(
                              "whitespace-pre-wrap break-words text-center flex items-center justify-center tracking-tight w-full max-w-3xl mx-auto leading-relaxed",
                              isRevealed
                                ? "text-xl md:text-2xl text-foreground"
                                : "text-xl md:text-2xl text-foreground/90",
                            )}
                          >
                            {isRevealed
                              ? currentCard?.term
                              : currentCard?.definition}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <div className="mt-8">
                      {!isRevealed ? (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {srsRatings.map((rating) => {
                              const config = ratingConfig[rating];
                              const Icon = config.icon;
                              return (
                                <motion.div
                                  key={rating}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRating(rating as SrsRating);
                                    }}
                                    variant="outline"
                                    disabled={isReviewing}
                                    className={cn(
                                      "h-full p-3 w-full flex flex-col items-center justify-center gap-1 rounded-lg border-2 transition-all hover:shadow-bento hover:-translate-y-1 active:translate-y-0 active:shadow-none border-border",
                                      config.bgColor,
                                      config.color
                                    )}
                                  >
                                    <Icon
                                      className={cn("h-4 w-4 mb-0.5", config.color)}
                                    />
                                    <div
                                      className={cn(
                                        "font-bold text-xs tracking-wider uppercase",
                                        config.color,
                                      )}
                                    >
                                      {config.label}
                                    </div>
                                    <div className="text-[10px] opacity-80 font-medium leading-tight text-center max-w-[90%]">
                                      {config.description}
                                    </div>
                                  </Button>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="min-h-64 flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
                    <BarChart3 className="h-8 w-8" />
                    <p className="font-semibold">Round complete</p>
                    <p className="text-sm">
                      Open the summary to continue or adjust session size.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pb-2 md:pb-4 mt-auto"
        >
          <Card className="border-2 border-border shadow-sm bento-card">
            <CardContent className="p-3">
              <div className="grid grid-cols-4 gap-3">
                {srsRatings.map((rating) => {
                  const config = ratingConfig[rating];
                  const count = stats[rating];
                  return (
                    <div
                      key={rating}
                      className={cn(
                        "p-2 rounded-md text-center border-2",
                        config.bgColor,
                        config.borderColor,
                      )}
                    >
                      <div
                        className={cn("text-xl font-bold font-editorial mb-0.5", config.color)}
                      >
                        {count}
                      </div>
                      <div className={cn("text-[10px] uppercase tracking-widest font-bold", config.color)}>
                        {config.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={completionOpen} onOpenChange={setCompletionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Learning Progress
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              Overall deck status after this study session
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border-2 border-border bg-background shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Not Yet Studied
                </div>
                <div className="text-xl font-bold font-editorial">{roundSummary.notYet}</div>
                <p className="text-[9px] font-medium text-muted-foreground mt-1">
                  Never reviewed
                </p>
              </div>
              <div className="p-3 rounded-lg border-2 border-border bg-background shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Forgotten</div>
                <div className="text-xl font-bold font-editorial">
                  {roundSummary.forgotten}
                </div>
                <p className="text-[9px] font-medium text-muted-foreground mt-1">
                  No review in 14+ days
                </p>
              </div>
              <div className="p-3 rounded-lg border-2 border-border bg-citrus shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">
                  Learning 
                </div>
                <div className="text-xl font-bold font-editorial text-foreground">
                  {roundSummary.learning}
                </div>
                <p className="text-[9px] font-medium text-foreground/60 mt-1">
                  In learning steps
                </p>
              </div>
              <div className="p-3 rounded-lg border-2 border-border bg-blush shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">
                  Hard
                </div>
                <div className="text-xl font-bold font-editorial text-foreground">{roundSummary.hard}</div>
                <p className="text-[9px] font-medium text-foreground/60 mt-1">
                  Unstable memory
                </p>
              </div>
              <div className="p-3 rounded-lg border-2 border-border bg-sky shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">
                  Good
                </div>
                <div className="text-xl font-bold font-editorial text-foreground">{roundSummary.good}</div>
                <p className="text-[9px] font-medium text-foreground/60 mt-1">
                  Progressing well
                </p>
              </div>
              <div className="p-3 rounded-lg border-2 border-border bg-mint shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">
                  Mastered
                </div>
                <div className="text-xl font-bold font-editorial text-foreground">
                  {roundSummary.mastered}
                </div>
                <p className="text-[9px] font-medium text-foreground/60 mt-1">
                  Stable retention
                </p>
              </div>
            </div>

            <div className="rounded-lg border-2 border-border bg-card shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Cards reviewed this round
                </span>
                <span className="font-medium">{seenCardIds.size}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Learning progress</span>
                <span className="font-medium">
                  {deckCardsWithUpdates.length - roundSummary.notYet} /{" "}
                  {deckCardsWithUpdates.length}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleBackToDeck}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Back to Deck
            </Button>
            <Button
              onClick={handleContinue}
              disabled={isReviewing}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              Next Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudySrsPage;


