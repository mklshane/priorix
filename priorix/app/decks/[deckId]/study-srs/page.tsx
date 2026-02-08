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

const ratingConfig = {
  again: {
    label: "Again",
    color: "text-red-700 dark:text-red-200",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    icon: RotateCcw,
  },
  hard: {
    label: "Hard",
    color: "text-orange-700 dark:text-orange-200",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    icon: Target,
  },
  good: {
    label: "Good",
    color: "text-blue-700 dark:text-blue-200",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    icon: Check,
  },
  easy: {
    label: "Easy",
    color: "text-green-700 dark:text-green-200",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
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
    const shuffled = [...pendingCards].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setRoundTotal(shuffled.length);
    setCompletedCount(0);
    setCurrentIndex(0);
    setIsRevealed(false);
    setCompletionOpen(false);
    setStats({ ...defaultStats });
    setHasStartedRound(true);
    setRoundCards(shuffled);
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
    
    setQueue(nextCards);
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

  const renderPreRound = () => (
    <div className="min-h-screen p-4 md:p-4 lg:p-8 px-2 bg-gradient-to-b from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2 md:space-y-4"
        >
          {/* Header Section */}
          <div className="space-y-1">
            
            <div className="hidden md:block bg-yellow/30 dark:bg-violet/20 rounded-lg p-4 border-2 border-primary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Ready to study</p>
                    <p className="text-2xl font-bold">{pendingCards.length}</p>
                  </div>
                </div>
                <Button
                  onClick={startRound}
                  disabled={isReviewing || pendingCards.length === 0}
                  size="lg"
                  className="gap-2 shadow-lg"
                >
                  <Zap className="h-5 w-5" />
                   Study
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Session Settings */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-2">
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
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
                          <Button
                            variant={
                              sessionSize === size ? "default" : "outline"
                            }
                            onClick={() => setSessionSize(size)}
                            disabled={roundActive || isReviewing}
                            className={cn(
                              "w-full h-15 flex flex-col gap-0 transition-all duration-200",
                              sessionSize === size
                                ? "shadow-lg shadow-primary/20 bg-yellow/50 dark:bg-violet/30 border-2 border-primary text-black dark:text-foreground"
                                : "hover:border-primary/50",
                            )}
                          >
                            <span className="text-xl md:text-2xl font-bold">{size}</span>
                            <span className="text-xs opacity-90">cards</span>
                            {sessionSize === size && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </Button>
                        </motion.div>
                      ))}
                    </div>

                    
                  </div>
                </CardContent>
              </Card>

              {/* Progress Stats */}
              <Card className="border-2">
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
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${((deckCardsWithUpdates.length - preRoundSummary.notYet) / deckCardsWithUpdates.length) * 100}%`,
                          }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-yellow to-primary rounded-full"
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
                      <div className="bg-yellow/20 dark:bg-violet/20 rounded-lg p-4 text-center border border-primary/20">
                        <div className="text-2xl font-bold text-primary">
                          {preRoundSummary.learning}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Learning
                        </div>
                      </div>
                      <div className="bg-green/20 dark:bg-green/30 rounded-lg p-4 text-center border border-green/40">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {preRoundSummary.mastered}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Mastered
                        </div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 text-center border border-red-200 dark:border-red-800">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {preRoundSummary.hard}
                        </div>
                        <div className="text-sm text-muted-foreground">
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
              <Card className="border-2 h-full">
                <CardContent className=" h-full">
                  <div className="space-y-2 h-full flex flex-col">
                    <div>
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Check className="h-5 w-5 text-primary" />
                        Status Overview
                      </h2>
                    </div>

                    <div className="space-y-2 flex-1">
                      {/* Not Yet Studied */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Not Yet</p>
                            <p className="text-xs text-muted-foreground">
                              Never reviewed
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold">
                          {preRoundSummary.notYet}
                        </div>
                      </div>

                      {/* Learning */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-yellow/20 dark:bg-violet/20 border-2 border-primary/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <RotateCcw className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Learning</p>
                            <p className="text-xs text-muted-foreground">
                              In learning steps
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {preRoundSummary.learning}
                        </div>
                      </div>

                      {/* Hard */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                            <Target className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="font-medium">Hard</p>
                            <p className="text-xs text-muted-foreground">
                              Unstable memory
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {preRoundSummary.hard}
                        </div>
                      </div>

                      {/* Good */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue/20 dark:bg-blue/30 border-2 border-blue/40">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue/30 flex items-center justify-center">
                            <Check className="h-4 w-4 text-blue" />
                          </div>
                          <div>
                            <p className="font-medium">Good</p>
                            <p className="text-xs text-muted-foreground">
                              Progressing well
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue">
                          {preRoundSummary.good}
                        </div>
                      </div>

                      {/* Mastered */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green/20 dark:bg-green/30 border-2 border-green/40">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green/30 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-green" />
                          </div>
                          <div>
                            <p className="font-medium">Mastered</p>
                            <p className="text-xs text-muted-foreground">
                              Long-term retention
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-green">
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
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t-2 border-primary/20 p-4 sm:hidden">
            <div className="max-w-4xl mx-auto">
              <Button
                onClick={startRound}
                disabled={isReviewing || pendingCards.length === 0}
                size="lg"
                className="w-full gap-2 py-7 shadow-lg bg-yellow/50 dark:bg-violet/30 border-2 border-primary text-black dark:text-foreground"
              >
                <Zap className="h-5 w-5" />
                Start Studying {sessionSize} Cards
              </Button>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {roundTotal > 0 && currentCard
                      ? `Card ${cardPosition} of ${roundTotal}`
                      : "Round complete"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">
                  {Math.round(progress)}% Complete
                </div>
                <div className="text-xs text-muted-foreground">
                  {cardsRemaining} cards remaining
                </div>
              </div>
              <div className="w-24">
                <Progress value={progress} className="h-2" />
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
            className="mb-8"
          >
            <Card
              onClick={toggleReveal}
              className={cn(
                "border-2 shadow-2xl overflow-hidden transition-all duration-300 cursor-pointer",
                isRevealed
                  ? "border-primary bg-yellow/50 dark:bg-violet/50"
                  : "border-primary bg-yellow/30 dark:bg-violet/20",
                isFlipping && "transform-gpu",
              )}
            >
              <CardContent className="p-4 md:p-8 md:pb-0">
                {currentCard ? (
                  <>
                    <div className="min-h-64 flex flex-col items-center justify-center text-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={isRevealed ? "answer" : "question"}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="space-y-6 w-full"
                        >
                          <div
                            className={cn(
                              "whitespace-pre-line break-words",
                              isRevealed
                                ? "text-2xl md:text-3xl font-bold leading-tight"
                                : "text-lg md:text-xl font-semibold leading-relaxed",
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
                          <div className="grid grid-cols-4 md:grid-cols-4 gap-3">
                            {srsRatings.map((rating) => {
                              const config = ratingConfig[rating];
                              const Icon = config.icon;
                              return (
                                <motion.div
                                  key={rating}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    onClick={() =>
                                      handleRating(rating as SrsRating)
                                    }
                                    variant="outline"
                                    disabled={isReviewing}
                                    className={cn(
                                      "h-18 w-full flex flex-col gap-1 border-2 text-left bg-white dark:bg-card",
                                      config.bgColor,
                                      config.borderColor,
                                      config.color,
                                      "hover:shadow-md transition-all",
                                    )}
                                  >
                                    <Icon
                                      className={cn("h-5 w-5", config.color)}
                                    />
                                    <div
                                      className={cn(
                                        "font-semibold text-sm",
                                        config.color,
                                      )}
                                    >
                                      {config.label}
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
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <Card className="border">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-2">
                {srsRatings.map((rating) => {
                  const config = ratingConfig[rating];
                  const count = stats[rating];
                  return (
                    <div
                      key={rating}
                      className={cn(
                        "p-3 rounded-lg text-center transition-all",
                        config.bgColor,
                        config.borderColor,
                        "border",
                      )}
                    >
                      <div
                        className={cn("text-2xl font-bold mb-1", config.color)}
                      >
                        {count}
                      </div>
                      <div className={cn("text-xs font-medium", config.color)}>
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
              <div className="p-3 rounded-lg border bg-muted/40">
                <div className="text-xs text-muted-foreground">
                  Not Yet Studied
                </div>
                <div className="text-xl font-bold">{roundSummary.notYet}</div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  Never reviewed
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/40">
                <div className="text-xs text-muted-foreground">Forgotten</div>
                <div className="text-xl font-bold">
                  {roundSummary.forgotten}
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  No review in the last 14 days
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-yellow/20 dark:bg-violet/20">
                <div className="text-xs text-muted-foreground">
                  Learning 
                </div>
                <div className="text-xl font-bold">
                  {roundSummary.learning}
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  In learning steps or rated Again
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/30">
                <div className="text-xs text-muted-foreground">
                  Hard (unstable)
                </div>
                <div className="text-xl font-bold">{roundSummary.hard}</div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  Low ease (&lt;2.0) or 3+ lapses
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30">
                <div className="text-xs text-muted-foreground">
                  Good (progressing)
                </div>
                <div className="text-xl font-bold">{roundSummary.good}</div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  Graduated, progressing well (1-13 days)
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/30">
                <div className="text-xs text-muted-foreground">
                  Mastered (stable)
                </div>
                <div className="text-xl font-bold">
                  {roundSummary.mastered}
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  Interval ≥ 14 days, 4+ reps, ease ≥ 2.2
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
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
