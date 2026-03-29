"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, ArrowRight, CheckCircle2, XCircle, Clock, Target } from "lucide-react";
import confetti from "canvas-confetti";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuizAnswer, QuizQuestion } from "@/types/quiz";
import { cn } from "@/lib/utils";

interface QuizResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  answers: QuizAnswer[];
  questions: QuizQuestion[];
  sessionQuality: number;
  deckId: string;
  quizConfig?: { questionCount: number; quizTypes: string[] } | null;
  onQuizAgain?: () => void;
}

const QuizResultsModal = ({
  isOpen,
  onClose,
  answers,
  questions,
  sessionQuality,
  deckId,
  quizConfig,
  onQuizAgain,
}: QuizResultsModalProps) => {
  const router = useRouter();
  const [showReview, setShowReview] = useState(false);

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const incorrectCount = answers.length - correctCount;
  const score = Math.round((correctCount / answers.length) * 100);
  const totalTime = answers.reduce((sum, a) => sum + a.responseTime, 0);
  const averageTime = Math.round(totalTime / answers.length / 1000);

  // Trigger confetti for good scores
  useEffect(() => {
    if (isOpen && score >= 80) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#FFD700", "#FFA500", "#FF6347"],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#FFD700", "#FFA500", "#FF6347"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen, score]);

  const getPerformanceMessage = () => {
    if (score >= 90) return "Outstanding! 🌟";
    if (score >= 80) return "Great Job! 🎉";
    if (score >= 70) return "Well Done! 👏";
    if (score >= 60) return "Good Effort! 💪";
    return "Keep Practicing! 📚";
  };

  const getScoreColor = () => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const handleRetakeQuiz = () => {
    router.push(`/decks/${deckId}/quiz`);
  };

  const handleStudyIncorrect = () => {
    const incorrectCardIds = answers
      .filter((a) => !a.isCorrect)
      .map((a) => a.cardId);
    
    // Store incorrect card IDs in localStorage for SRS mode to pick up
    localStorage.setItem(`study-incorrect-${deckId}`, JSON.stringify(incorrectCardIds));
    router.push(`/decks/${deckId}/study-srs`);
  };

  if (!showReview) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[92dvh] md:max-h-[85dvh] flex flex-col border-2 border-border rounded-3xl bg-background shadow-bento-sm p-4 md:p-5 overflow-hidden">
          <DialogHeader className="shrink-0 mb-3">
            <DialogTitle className="text-xl md:text-2xl font-bold font-sans text-center">Quiz Complete!</DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-y-auto min-h-0 space-y-3 md:space-y-4 px-1 py-1">
            {/* Score Display */}
            <div className="text-center space-y-1 py-3 md:py-4 bg-card rounded-2xl border-2 border-border shadow-bento-sm">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="inline-block"
              >
                <div className={cn("text-5xl font-bold font-sans", getScoreColor())}>
                  {score}%
                </div>
              </motion.div>
              <p className="text-base font-semibold font-sans">{getPerformanceMessage()}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 shrink-0">
              <Card className="border-2 border-border rounded-2xl shadow-bento-sm bg-card hover:-translate-y-1 py-0 transition-transform">
                <CardContent className="p-2 py-3 md:p-3 text-center flex flex-col items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 mb-1 text-green-500" />
                  <div className="text-lg md:text-xl font-bold font-sans">{correctCount}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Correct</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border rounded-2xl shadow-bento-sm bg-card hover:-translate-y-1 py-0 transition-transform">
                <CardContent className="p-2 py-3 md:p-3 text-center flex flex-col items-center justify-center">
                  <XCircle className="h-5 w-5 mb-1 text-red-500" />
                  <div className="text-lg md:text-xl font-bold font-sans">{incorrectCount}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Incorrect</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border rounded-2xl shadow-bento-sm bg-card hover:-translate-y-1 py-0 transition-transform">
                <CardContent className="p-2 py-3 md:p-3 text-center flex flex-col items-center justify-center">
                  <Clock className="h-5 w-5 mb-1 text-blue-500" />
                  <div className="text-lg md:text-xl font-bold font-sans">{averageTime}s</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg Time</div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="space-y-2 shrink-0 mt-auto pt-2">
              {incorrectCount > 0 && (
                <Button
                  onClick={handleStudyIncorrect}
                  className="w-full h-10 bg-mint hover:bg-mint/90 text-black font-bold border-2 border-border rounded-full hover:-translate-y-0.5 active:translate-y-0 transition-all font-sans text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Study Incorrect Cards
                </Button>
              )}

              {onQuizAgain && quizConfig && (
                <Button
                  onClick={onQuizAgain}
                  className="w-full h-10 bg-lilac hover:bg-lilac/90 text-black border-2 border-border font-bold rounded-full hover:-translate-y-0.5 active:translate-y-0 transition-all font-sans text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Quiz Again ({quizConfig.questionCount}q)
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setShowReview(true)}
                  variant="outline"
                  className="h-10 border-2 border-border font-bold rounded-full hover:-translate-y-0.5 active:translate-y-0 bg-background shadow-bento-sm hover:bg-accent transition-all font-sans text-sm"
                >
                  Review
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <Button
                  onClick={onClose}
                  className="h-10 bg-foreground hover:bg-foreground/90 text-background font-bold border-2 border-border rounded-full hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-bento-sm font-sans text-sm"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Review Mode
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[92dvh] md:max-h-[85dvh] flex flex-col border-2 border-border rounded-3xl bg-background shadow-bento-sm p-3 md:p-5 overflow-hidden">
        <DialogHeader className="shrink-0 mb-2 pb-2 border-b-2 border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg md:text-xl font-bold font-sans">Review Answers</DialogTitle>
            <Button
              onClick={() => setShowReview(false)}
              variant="outline"
              size="sm"
              className="h-8 md:h-9 border-2 border-border font-bold rounded-full hover:-translate-y-0.5 active:translate-y-0 shadow-bento-sm transition-all text-xs"
            >
              Back
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-y-auto min-h-0 space-y-3 px-1 py-1">
          {questions.map((question, index) => {
            const answer = answers[index];
            const isCorrect = answer?.isCorrect;

            return (
              <Card
                key={index}
                className={cn(
                  "border-2 rounded-2xl shadow-bento-sm shrink-0",
                  isCorrect
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                    : "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                )}
              >
                <CardContent className="p-3 md:p-4">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-background border-2 border-border flex items-center justify-center font-bold text-xs md:text-sm shadow-bento-sm">
                        {index + 1}
                      </span>
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider px-2 py-0.5 md:py-1 md:px-3 rounded-full bg-background border-2 border-border shadow-bento-sm">
                        {question.type === "mcq" ? "MCQ" : "True/False"}
                      </span>
                    </div>
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                    )}
                  </div>

                  {/* Question */}
                  <h3 className="font-bold font-sans text-sm md:text-base mb-3">{question.questionText}</h3>

                  {/* User's Answer */}
                  <div className="space-y-2 text-xs md:text-sm">
                    <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-2">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] md:text-[11px]">Your Answer:</span>
                      <span
                        className={cn(
                          "px-2 py-1 md:py-1.5 rounded-lg md:rounded-xl border-2",
                          isCorrect
                            ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-800 text-green-800 dark:text-green-200"
                            : "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-800 text-red-800 dark:text-red-200"
                        )}
                      >
                        {answer.selectedAnswer}
                      </span>
                    </div>

                    {!isCorrect && (
                      <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-2">
                        <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] md:text-[11px]">Correct Answer:</span>
                        <span className="px-2 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-green-100 border-2 border-green-300 dark:bg-green-900/30 dark:border-green-800 text-green-800 dark:text-green-200">
                          {question.correctAnswer}
                        </span>
                      </div>
                    )}

                    {question.explanation && (
                      <div className="mt-2 p-2.5 md:p-3 rounded-md bg-background border-2 border-border shadow-bento-sm">
                        <span className="font-bold text-[10px] md:text-[11px] uppercase tracking-wider text-muted-foreground block mb-0.5">Explanation</span>
                        <p className="font-medium text-[11px] md:text-xs">{question.explanation}</p>
                      </div>
                    )}

                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-2.5 pt-2.5 flex items-center justify-between border-t-2 border-border/50">
                      <span>Response time: {Math.round(answer.responseTime / 1000)}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 pt-3 mt-1">
          <Button
            onClick={onClose}
            className="w-full h-10 bg-foreground hover:bg-foreground/90 text-background font-bold border-2 border-border rounded-full hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-bento-sm font-sans"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizResultsModal;


