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
      <DialogContent className="sm:max-w-md rounded-3xl border-2 border-border p-0 overflow-hidden bg-card">
        <DialogHeader className="px-6 pt-4 pb-2 bg-lilac border-b-2 border-border flex flex-col items-center text-center">
          <DialogTitle className="text-2xl font-editorial tracking-tight font-bold text-foreground">Configure Quiz</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-0 font-medium">
            Customize your quiz experience
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 py-2 space-y-4">
          {/* Question Count */}
          <div className="space-y-3">
            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Number of Questions</Label>
            <RadioGroup value={questionCount.toString()} onValueChange={(val: string) => !isLoading && setQuestionCount(parseInt(val))} disabled={isLoading}>
              <div className="grid grid-cols-4 gap-1.5">
                {availableCounts.map((count) => (
                  <Card 
                    key={count}
                    className={`transition-all duration-300 border-2 rounded-2xl ${
                      questionCount === count 
                        ? "border-primary bg-primary/10 shadow-bento-sm -translate-y-1" 
                        : "border-border hover:border-primary/50 hover:shadow-bento-sm bg-background"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => !isLoading && setQuestionCount(count)}
                  >
                    <CardContent className="p-0 flex flex-col items-center justify-center gap-1">
                      <RadioGroupItem value={count.toString()} id={`count-${count}`} className="sr-only" />
                      <span className="font-bold text-xl font-editorial">
                        {count}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Cards</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Question Types</Label>
            <div className="grid grid-cols-2 gap-1.5">
              <Card 
                className={`transition-all duration-300 border-2 rounded-2xl \${
                  quizTypes.includes("mcq")
                    ? "border-primary bg-primary/10 shadow-bento-sm -translate-y-1" 
                    : "border-border hover:border-primary/50 hover:shadow-bento-sm bg-background"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => !isLoading && handleQuizTypeToggle("mcq")}
              >
                <CardContent className="p-3 py-0">
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
                className={`transition-all duration-300 border-2 rounded-2xl \${
                  quizTypes.includes("true-false")
                    ? "border-primary bg-primary/10 shadow-bento-sm -translate-y-1" 
                    : "border-border hover:border-primary/50 hover:shadow-bento-sm bg-background"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => !isLoading && handleQuizTypeToggle("true-false")}
              >
                <CardContent className="p-3 py-0">
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
        <Card className="bg-muted/30 border-t-2 border-x-0 border-b-0 border-border rounded-none">
          <CardContent className="py-0">
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
        <div className="flex gap-4 p-8 pt-4 bg-muted/30">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-12 rounded-full border-2 border-border font-bold hover:-translate-y-1 hover:shadow-bento-sm transition-all text-sm uppercase tracking-wider"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={quizTypes.length === 0 || isLoading}
            className="flex-1 h-12 rounded-full border-2 border-border font-bold bg-mint hover:bg-mint/90 text-primary hover:-translate-y-1 hover:shadow-bento-sm transition-all text-sm uppercase tracking-wider"
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


