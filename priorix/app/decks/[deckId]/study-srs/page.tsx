"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
  RotateCcw,
  Target,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { srsRatings, srsSessionSizes, SrsRating } from "@/lib/srs-config";
import { useSrsStudy } from "@/hooks/useSrsStudy";
import { useDeck } from "@/hooks/useDeck";
import { useToast } from "@/hooks/useToast";
import { IFlashcard } from "@/types/flashcard";
import LoadingState from "@/components/DeckDetails/LoadingState";

const sessionSizeStorageKey = (deckId: string) => `srs-session-size-${deckId}`;
type RoundStats = Record<SrsRating, number>;

const defaultStats: RoundStats = {
  again: 0,
  hard: 0,
  good: 0,
  easy: 0,
};

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

  const { deck, isLoading: isDeckLoading, error: deckError } = useDeck(deckId);

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
    }
  }, [dueCards, hasStartedRound]);

  const currentCard = queue[currentIndex];
  const isPending =
    isDeckLoading ||
    (isDueLoading &&
      !dueCards.length &&
      !pendingCards.length &&
      !hasStartedRound);
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
  };

  const handleRating = async (rating: SrsRating) => {
    if (!currentCard) return;
    try {
      await review({ cardId: currentCard._id, rating });
      setStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
      setCompletedCount((prev) => prev + 1);

      const nextQueue = queue.filter((_, idx) => idx !== currentIndex);
      if (nextQueue.length === 0) {
        setQueue([]);
        setCompletionOpen(true);
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
      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          (active as HTMLElement).isContentEditable);
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
    const result = await refetchDue();
    const nextCards = (result.data || []) as IFlashcard[];
    setQueue(nextCards);
    setPendingCards(nextCards);
    setRoundTotal(nextCards.length);
    setCompletedCount(0);
    setCurrentIndex(0);
    setIsRevealed(false);
    setCompletionOpen(false);
    setStats({ ...defaultStats });
    setHasStartedRound(nextCards.length > 0);
  };

  const handleBackToDeck = () => {
    router.push(`/decks/${deckId}`);
  };

  const progress =
    roundTotal > 0 ? Math.min((completedCount / roundTotal) * 100, 100) : 0;
  const totalReviews = Object.values(stats).reduce((a, b) => a + b, 0);
  const cardsRemaining = Math.max(roundTotal - completedCount, 0);
  const cardPosition = currentCard
    ? Math.min(completedCount + 1, roundTotal)
    : roundTotal;

  const renderPreRound = () => (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
           
              <div>
                <h1 className="text-2xl font-semibold">Spaced Repetition</h1>
              
              </div>
            </div>
           
          </div>

          <Card className="border shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Session size</h2>
                  <p className="text-sm text-muted-foreground">
                    {pendingCards.length} cards due now
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Pick how many to study</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {srsSessionSizes.map((size) => (
                  <motion.div
                    key={size}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      variant={sessionSize === size ? "default" : "outline"}
                      onClick={() => setSessionSize(size)}
                      disabled={roundActive || isReviewing}
                      className="w-full h-16 flex flex-col gap-1"
                    >
                      <span className="text-xl font-bold">{size}</span>
                      <span className="text-xs opacity-80">cards</span>
                    </Button>
                  </motion.div>
                ))}
              </div>

              <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Ready to study</p>
                  <p className="text-base font-semibold">
                    {pendingCards.length} card{pendingCards.length === 1 ? "" : "s"} queued
                  </p>
                </div>
                <div className="flex gap-3">
                  {pendingCards.length === 0 ? (
                    <>
                      <Button
                        onClick={() => refetchDue()}
                        variant="outline"
                        className="gap-2"
                        disabled={isReviewing}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Refresh
                      </Button>
                      <Button onClick={handleBackToDeck} variant="ghost">
                        Back to Deck
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={startRound}
                      disabled={isReviewing}
                      className="gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Start ({sessionSize})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );

  if (isPending) {
    return <LoadingState />;
  }

  if (deckError || dueError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
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

  if (!hasStartedRound) {
    return renderPreRound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap ">
            <div className="flex items-center ">
              
              <div>
                <div className="flex items-center text-sm text-muted-foreground">
                  
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
              

              <CardContent className="p-2 md:p-4 px-4 md:px-8">
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
                          <div className="text-xl md:text-3xl font-bold leading-relaxed">
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
                          <Button
                            onClick={toggleReveal}
                            variant="outline"
                            className="w-full gap-2"
                          >
                            Reveal Answer (Space)
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-4 gap-1.5">
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
                                      "h-15 w-full flex flex-col gap-1 border-2 text-left bg-white dark:bg-card",
                                      config.bgColor,
                                      config.borderColor,
                                      config.color,
                                      "hover:shadow-md transition-all",
                                    )}
                                  >
                                    <Icon className={cn("h-5 w-5", config.color)} />
                                    <div className={cn("font-semibold text-sm", config.color)}>
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
                    <p className="text-sm">Open the summary to continue or adjust session size.</p>
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
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
              <Check className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl pt-4">
              Session Complete! 🎉
            </DialogTitle>
            <DialogDescription className="text-center">
              You reviewed {totalReviews} cards in this session
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {srsRatings.map((rating) => {
                const config = ratingConfig[rating];
                return (
                  <div
                    key={rating}
                    className={cn(
                      "p-3 rounded-lg flex items-center justify-between",
                      config.bgColor,
                      config.borderColor,
                      "border",
                    )}
                  >
                    <span className={cn("font-medium", config.color)}>
                      {config.label}
                    </span>
                    <span className={cn("text-xl font-bold", config.color)}>
                      {stats[rating]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Next Session Size</p>
              <div className="flex flex-wrap gap-2">
                {srsSessionSizes.map((size) => (
                  <Button
                    key={size}
                    variant={sessionSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSessionSize(size)}
                    disabled={isReviewing}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Session Duration</span>
                <span className="font-medium">
                  ~{Math.ceil(totalReviews * 0.5)} min
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cards Reviewed</span>
                <span className="font-medium">{totalReviews}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mastery Rate</span>
                <span className="font-medium text-green-600">
                  {stats.good + stats.easy > 0
                    ? Math.round(
                        ((stats.good + stats.easy) / Math.max(totalReviews, 1)) * 100,
                      )
                    : 0}
                  %
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
              <ArrowLeft className="h-4 w-4" />
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
