"use client";

import { Lightbulb, TrendingUp, AlertCircle, Clock } from "lucide-react";

export default function InsightsPanel({ insights }: { insights: any[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case "optimal_time":
        return <Clock className="h-4 w-4" />;
      case "performance_trend":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="bento-card bg-card p-6 font-sans h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-lilac border-2 border-border flex items-center justify-center shadow-bento-sm">
          <Lightbulb className="h-5 w-5" />
        </div>
        <h3 className="text-2xl font-editorial italic">Personal Insights</h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="p-5 border-2 border-border rounded-2xl bg-muted/30 flex items-start gap-4 hover:-translate-y-1 transition-all"
          >
            <div className="p-2 bg-background border-2 border-border rounded-xl shrink-0 shadow-sm">
              {getIcon(insight.type)}
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-1">
                {insight.title}
              </h4>
              <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                {insight.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
