"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Clock, TrendingUp } from "lucide-react";

interface QuizPerformanceProps {
  quizSessions?: any[];
  layout?: "grid" | "vertical";
}

const QuizPerformance = ({ quizSessions = [], layout = "grid" }: QuizPerformanceProps) => {
  // Calculate quiz-specific stats
  const totalQuizzes = quizSessions.length;
  const averageScore = quizSessions.length > 0
    ? Math.round(
        quizSessions.reduce((sum, s) => sum + (s.quizScore || 0), 0) / quizSessions.length
      )
    : 0;
  const highestScore = quizSessions.length > 0
    ? Math.max(...quizSessions.map((s) => s.quizScore || 0))
    : 0;
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
            Take your first quiz to see performance stats! 📝
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
        {quizSessions.length > 0 && (
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
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-black dark:border-darkborder"
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
                    <div className={`text-lg font-bold ${scoreColor}`}>
                      {score}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizPerformance;
