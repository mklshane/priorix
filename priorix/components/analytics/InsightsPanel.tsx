"use client";

import { Lightbulb, TrendingUp, AlertCircle, Clock } from "lucide-react";

interface Insight {
  type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export default function InsightsPanel({ insights }: { insights: Insight[] }) {
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

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-mint border-border shadow-bento-sm";
      case "medium":
        return "bg-lilac border-border shadow-bento-sm";
      default:
        return "bg-blush border-border shadow-bento-sm";
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-citrus border-2 border-border flex items-center justify-center shadow-bento-sm">
          <Lightbulb className="h-5 w-5" />
        </div>
        <h3 className="text-2xl font-editorial italic">Learning Insights</h3>
      </div>

      {insights.length === 0 ? (
        <div className="bento-card bg-muted/30 border-dashed text-center py-12 text-muted-foreground font-medium italic">
          Complete more study sessions to unlock personalized insights
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-5 border-2 rounded-2xl flex items-start gap-4 transition-all hover:-translate-y-1 ${getPriorityStyle(insight.priority)}`}
            >
              <div className="p-2 bg-background/50 rounded-xl border-2 border-border/20 shrink-0">
                {getIcon(insight.type)}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm uppercase tracking-wider leading-tight">
                  {insight.title}
                </h4>
                <p className="text-sm font-medium leading-relaxed opacity-90">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
