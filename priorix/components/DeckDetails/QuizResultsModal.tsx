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
        <DialogContent className="sm:max-w-2xl border-2 border-black dark:border-darkborder rounded-xl bg-white dark:bg-card">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold font-sora text-center">Quiz Complete!</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Score Display */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="inline-block"
              >
                <div className={cn("text-7xl font-bold", getScoreColor())}>
                  {score}%
                </div>
              </motion.div>
              <p className="text-xl font-semibold">{getPerformanceMessage()}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-2 border-black dark:border-darkborder">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{correctCount}</div>
                  <div className="text-xs text-muted-foreground">Correct</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-black dark:border-darkborder">
                <CardContent className="p-4 text-center">
                  <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                  <div className="text-2xl font-bold">{incorrectCount}</div>
                  <div className="text-xs text-muted-foreground">Incorrect</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-black dark:border-darkborder">
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{averageTime}s</div>
                  <div className="text-xs text-muted-foreground">Avg Time</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-black dark:border-darkborder">
                <CardContent className="p-4 text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{sessionQuality}%</div>
                  <div className="text-xs text-muted-foreground">Quality</div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Breakdown */}
            <Card className="border-2 border-black dark:border-darkborder bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Questions Answered:</span>
                  <span className="font-bold">{answers.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Total Time:</span>
                  <span className="font-bold">{Math.round(totalTime / 1000)}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Accuracy:</span>
                  <span className={cn("font-bold", getScoreColor())}>{score}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              {incorrectCount > 0 && (
                <Button
                  onClick={handleStudyIncorrect}
                  className="w-full bg-green text-black font-bold border-2 border-black dark:border-darkborder"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Study Incorrect Cards with SRS
                </Button>
              )}

              {onQuizAgain && quizConfig && (
                <Button
                  onClick={onQuizAgain}
                  variant="outline"
                  className="w-full border-2 bg-purple border-black dark:border-darkborder font-bold"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Quiz Again ({quizConfig.questionCount} questions)
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setShowReview(true)}
                  variant="outline"
                  className="border-2 border-black dark:border-darkborder font-bold"
                >
                  Review Answers
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <Button
                  onClick={onClose}
                  className="bg-yellow hover:bg-yellow/90 text-black font-bold border-2 border-black dark:border-darkborder"
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-black dark:border-darkborder rounded-xl bg-white dark:bg-card">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold font-sora">Review Answers</DialogTitle>
            <Button
              onClick={() => setShowReview(false)}
              variant="outline"
              size="sm"
              className="border-2 border-black dark:border-darkborder"
            >
              Back to Summary
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {questions.map((question, index) => {
            const answer = answers[index];
            const isCorrect = answer?.isCorrect;

            return (
              <Card
                key={index}
                className={cn(
                  "border-2",
                  isCorrect
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                    : "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                )}
              >
                <CardContent className="p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted border-2 border-black dark:border-darkborder flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted border border-black dark:border-darkborder">
                        {question.type === "mcq" ? "MCQ" : "True/False"}
                      </span>
                    </div>
                    {isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>

                  {/* Question */}
                  <h3 className="font-bold text-lg mb-4">{question.questionText}</h3>

                  {/* User's Answer */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Your Answer:</span>
                      <span
                        className={cn(
                          "px-2 py-1 rounded font-medium",
                          isCorrect
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                        )}
                      >
                        {answer.selectedAnswer}
                      </span>
                    </div>

                    {!isCorrect && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Correct Answer:</span>
                        <span className="px-2 py-1 rounded font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          {question.correctAnswer}
                        </span>
                      </div>
                    )}

                    {question.explanation && (
                      <div className="mt-3 p-3 rounded bg-muted/50 border border-black dark:border-darkborder">
                        <span className="font-semibold">Explanation: </span>
                        {question.explanation}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-2">
                      Response time: {Math.round(answer.responseTime / 1000)}s
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={onClose}
            className="flex-1 bg-yellow hover:bg-yellow/90 text-black font-bold border-2 border-black dark:border-darkborder"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizResultsModal;
