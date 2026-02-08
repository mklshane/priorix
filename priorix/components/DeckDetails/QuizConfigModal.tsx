"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { QuizType } from "@/types/quiz";
import { Loader2 } from "lucide-react";

interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz: (config: { questionCount: number; quizTypes: QuizType[] }) => void;
  totalCards: number;
  deckId: string;
  isLoading?: boolean;
}

const QuizConfigModal = ({ isOpen, onClose, onStartQuiz, totalCards, deckId, isLoading = false }: QuizConfigModalProps) => {
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [quizTypes, setQuizTypes] = useState<QuizType[]>(["mcq", "true-false"]);

  // Load preferences from localStorage
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(`quizPrefs-${deckId}`);
      if (saved) {
        try {
          const prefs = JSON.parse(saved);
          if (prefs.questionCount) setQuestionCount(prefs.questionCount);
          if (prefs.quizTypes) setQuizTypes(prefs.quizTypes);
        } catch (e) {
          console.error("Failed to load quiz preferences:", e);
        }
      }
    }
  }, [isOpen, deckId]);

  const availableCounts = [5, 10, 15, 20].filter((count, index, arr) => {
    return count <= totalCards && arr.indexOf(count) === index;
  }).sort((a, b) => a - b);

  const handleQuizTypeToggle = (type: QuizType) => {
    setQuizTypes((prev) => {
      if (prev.includes(type)) {
        // Don't allow removing the last type
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleStart = () => {
    const config = { questionCount, quizTypes };
    
    // Save preferences
    localStorage.setItem(`quizPrefs-${deckId}`, JSON.stringify(config));
    
    onStartQuiz(config);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
      <DialogContent className="sm:max-w-2xl border-2 border-black dark:border-darkborder rounded-xl bg-white dark:bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-sora">Configure Quiz</DialogTitle>
          <DialogDescription className="text-sm">
            Customize your quiz experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Question Count */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Number of Questions</Label>
            <RadioGroup value={questionCount.toString()} onValueChange={(val: string) => !isLoading && setQuestionCount(parseInt(val))} disabled={isLoading}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {availableCounts.map((count) => (
                  <Card 
                    key={count}
                    className={`transition-all border-2 ${
                      questionCount === count 
                        ? "border-black dark:border-white bg-yellow/20 dark:bg-yellow/10" 
                        : "border-gray-300 dark:border-darkborder hover:border-gray-400"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => !isLoading && setQuestionCount(count)}
                  >
                    <CardContent className="p-3 flex items-center justify-center">
                      <RadioGroupItem value={count.toString()} id={`count-${count}`} className="sr-only" />
                      <span className="font-bold text-lg">
                        {count}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Quiz Types */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Question Types</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Card 
                className={`transition-all border-2 ${
                  quizTypes.includes("mcq")
                    ? "border-black dark:border-white bg-yellow/20 dark:bg-yellow/10" 
                    : "border-gray-300 dark:border-darkborder hover:border-gray-400"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => !isLoading && handleQuizTypeToggle("mcq")}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="mcq"
                      checked={quizTypes.includes("mcq")}
                      onCheckedChange={() => !isLoading && handleQuizTypeToggle("mcq")}
                      disabled={isLoading}
                      className="pointer-events-none"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Multiple Choice</div>
                      <div className="text-xs text-muted-foreground">4 options</div>
                    </div>
                    <span className="text-xl">🎯</span>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`transition-all border-2 ${
                  quizTypes.includes("true-false")
                    ? "border-black dark:border-white bg-yellow/20 dark:bg-yellow/10" 
                    : "border-gray-300 dark:border-darkborder hover:border-gray-400"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => !isLoading && handleQuizTypeToggle("true-false")}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="true-false"
                      checked={quizTypes.includes("true-false")}
                      onCheckedChange={() => !isLoading && handleQuizTypeToggle("true-false")}
                      disabled={isLoading}
                      className="pointer-events-none"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">True or False</div>
                      <div className="text-xs text-muted-foreground">Quick recall</div>
                    </div>
                    <span className="text-xl">✓✗</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Summary */}
        <Card className="bg-muted/50 border-2 border-black dark:border-darkborder mt-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-around text-sm">
              <div className="text-center">
                <div className="text-muted-foreground text-xs">Questions</div>
                <div className="font-bold text-lg">{questionCount}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs">Types</div>
                <div className="font-bold text-sm">
                  {quizTypes.length === 2 ? "Mixed" : quizTypes[0] === "mcq" ? "MCQ" : "T/F"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs">Est. Time</div>
                <div className="font-bold text-sm">~{Math.ceil(questionCount * 0.5)} min</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 border-2 border-black dark:border-darkborder"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={quizTypes.length === 0 || isLoading}
            className="flex-1 bg-yellow hover:bg-yellow/90 text-black font-bold border-2 border-black dark:border-darkborder disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Questions...
              </>
            ) : (
              "Start Quiz 🚀"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizConfigModal;
