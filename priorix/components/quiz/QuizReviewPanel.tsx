import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { QuizQuestion, QuizAnswer } from "@/types/quiz";
import { cn } from "@/lib/utils";

interface QuizReviewPanelProps {
  questions: QuizQuestion[];
  answers: QuizAnswer[];
}

const QuizReviewPanel = ({ questions, answers }: QuizReviewPanelProps) => {
  return (
    <div className="space-y-3">
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

              <h3 className="font-bold font-sans text-sm md:text-base mb-3">
                {question.questionText}
              </h3>

              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-2">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] md:text-[11px]">
                    Your Answer:
                  </span>
                  <span
                    className={cn(
                      "px-2 py-1 md:py-1.5 rounded-lg md:rounded-xl border-2",
                      isCorrect
                        ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-800 text-green-800 dark:text-green-200"
                        : "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-800 text-red-800 dark:text-red-200"
                    )}
                  >
                    {answer?.selectedAnswer}
                  </span>
                </div>

                {!isCorrect && (
                  <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-2">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] md:text-[11px]">
                      Correct Answer:
                    </span>
                    <span className="px-2 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-green-100 border-2 border-green-300 dark:bg-green-900/30 dark:border-green-800 text-green-800 dark:text-green-200">
                      {question.correctAnswer}
                    </span>
                  </div>
                )}

                {question.explanation && (
                  <div className="mt-2 p-2.5 md:p-3 rounded-md bg-background border-2 border-border shadow-bento-sm">
                    <span className="font-bold text-[10px] md:text-[11px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                      Explanation
                    </span>
                    <p className="font-medium text-[11px] md:text-xs">
                      {question.explanation}
                    </p>
                  </div>
                )}

                {answer && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-2.5 pt-2.5 border-t-2 border-border/50">
                    Response time: {Math.round(answer.responseTime / 1000)}s
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuizReviewPanel;
