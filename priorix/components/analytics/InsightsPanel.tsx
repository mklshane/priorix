import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertCircle, Clock } from "lucide-react";

interface Insight {
  type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface InsightsPanelProps {
  insights: Insight[];
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "optimal_time":
        return <Clock className="h-5 w-5" />;
      case "performance_trend":
        return <TrendingUp className="h-5 w-5" />;
      case "session_quality":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-green/70 dark:bg-green/20 border-black/10 dark:border-white/10";
      case "medium":
        return "bg-purple/70 dark:bg-purple/20 border-black/10 dark:border-white/10";
      default:
        return "bg-pink/70 dark:bg-pink/20 border-black/10 dark:border-white/10";
    }
  };

  return (
    <Card className="border-2 border-black dark:border-darkborder rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow" />
          <h3 className="text-lg font-semibold font-sora">Learning Insights</h3>
        </div>
        {insights.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Complete more study sessions to unlock personalized insights
          </p>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 border-2 rounded-xl ${getPriorityColor(
                  insight.priority
                )} transition-all hover:shadow-md`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">{getIcon(insight.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1 font-sora">
                      {insight.title}
                    </h4>
                    <p className="text-sm">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
