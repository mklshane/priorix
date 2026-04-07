"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Target, TrendingUp, Clock, FileText } from "lucide-react";
import QuizReviewPanel from "@/components/quiz/QuizReviewPanel";
import { QuizQuestion, QuizAnswer } from "@/types/quiz";

interface QuizSession {
  quizScore: number;
  quizType?: string;
  cardsReviewed: number;
  sessionStart: string;
  quizReview?: {
    questions: QuizQuestion[];
    answers: QuizAnswer[];
  } | null;
}

interface QuizPerformanceProps {
  quizSessions?: QuizSession[];
  layout?: "grid" | "vertical";
}

const QuizPerformance = ({ quizSessions = [], layout = "grid" }: QuizPerformanceProps) => {
  const [reviewSession, setReviewSession] = useState<QuizSession | null>(null);

  const totalQuizzes = quizSessions.length;
  const averageScore =
    quizSessions.length > 0
      ? Math.round(
          quizSessions.reduce((sum, s) => sum + (s.quizScore || 0), 0) / quizSessions.length
        )
      : 0;
  const highestScore =
    quizSessions.length > 0 ? Math.max(...quizSessions.map((s) => s.quizScore || 0)) : 0;
  const totalQuestions = quizSessions.reduce((sum, s) => sum + s.cardsReviewed, 0);

  const stats = [
    {
      title: "Total Quizzes",
      value: totalQuizzes,
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    },
    {
      title: "Average Score",
      value: `${averageScore}%`,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Best Score",
      value: `${highestScore}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "Questions Answered",
      value: totalQuestions,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  if (totalQuizzes === 0) {
    return (
      <Card className="border-2 border-black dark:border-darkborder">
        <CardHeader>
          <CardTitle className="text-lg font-bold font-sora">Quiz Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Take your first quiz to see performance stats!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-black dark:border-darkborder">
        <CardHeader>
          <CardTitle className="text-lg font-bold font-sora flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quiz Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={layout === "grid" ? "grid grid-cols-2 md:grid-cols-4 gap-4" : "space-y-4"}>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className={`p-4 rounded-lg border-2 border-black dark:border-darkborder ${stat.bgColor}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {stat.title}
                    </span>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              );
            })}
          </div>

          {/* Recent Quiz History */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">Recent Quizzes</h3>
            <div className="space-y-2">
              {quizSessions.slice(0, 5).map((session, index) => {
                const score = session.quizScore || 0;
                const scoreColor =
                  score >= 80
                    ? "text-green-600 dark:text-green-400"
                    : score >= 60
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400";
                return (
                  <div
                    key={index}
                    onClick={() => setReviewSession(session)}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-black dark:border-darkborder cursor-pointer hover:bg-muted hover:-translate-y-0.5 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-background border-2 border-black dark:border-darkborder flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {session.cardsReviewed} questions
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.sessionStart).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className={`text-lg font-bold ${scoreColor}`}>{score}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!reviewSession} onOpenChange={() => setReviewSession(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-3xl max-h-[92dvh] md:max-h-[85dvh] flex flex-col border-2 border-border rounded-3xl bg-background shadow-bento-sm p-3 md:p-5 overflow-hidden">
          <DialogHeader className="shrink-0 mb-2 pb-2 border-b-2 border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg md:text-xl font-bold font-sans">
                Review — {new Date(reviewSession?.sessionStart ?? "").toLocaleDateString()}
              </DialogTitle>
              <span className="text-sm font-bold text-muted-foreground">
                {reviewSession?.quizScore}%
              </span>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 px-1 py-1">
            {reviewSession?.quizReview?.questions?.length ? (
              <QuizReviewPanel
                questions={reviewSession.quizReview.questions}
                answers={reviewSession.quizReview.answers}
              />
            ) : (
              <div className="flex items-center justify-center h-full py-16 text-center">
                <div>
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold">No review data available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detailed reviews are saved for quizzes taken after this feature was added.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 pt-3 mt-1">
            <Button
              onClick={() => setReviewSession(null)}
              className="w-full h-10 bg-foreground hover:bg-foreground/90 text-background font-bold border-2 border-border rounded-full hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-bento-sm font-sans"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuizPerformance;
