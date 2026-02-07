"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StudyTimeHeatmapProps {
  timeOfDayStats: Array<{
    hour: number;
    sessions: number;
    averageAccuracy: number;
    averageCards: number;
  }>;
}

export default function StudyTimeHeatmap({ timeOfDayStats }: StudyTimeHeatmapProps) {
  const getIntensityColor = (accuracy: number, sessions: number) => {
    if (sessions === 0) return "bg-muted dark:bg-gray-800";
    if (accuracy >= 90) return "bg-green dark:bg-green/70";
    if (accuracy >= 80) return "bg-perry dark:bg-perry/70";
    if (accuracy >= 70) return "bg-yellow dark:bg-yellow/70";
    if (accuracy >= 60) return "bg-purple dark:bg-purple/70";
    return "bg-pink dark:bg-pink/70";
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Split into morning, afternoon, evening, night
  const timeBlocks = [
    { label: "Morning (6AM-12PM)", hours: timeOfDayStats.slice(6, 12) },
    { label: "Afternoon (12PM-6PM)", hours: timeOfDayStats.slice(12, 18) },
    { label: "Evening (6PM-12AM)", hours: timeOfDayStats.slice(18, 24) },
    { label: "Night (12AM-6AM)", hours: timeOfDayStats.slice(0, 6) },
  ];

  return (
    <Card className="border-2 border-black dark:border-darkborder rounded-xl">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 font-sora">Time-of-Day Performance</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Your accuracy by hour of day. Greener = better performance.
        </p>
        <div className="space-y-6">
          {timeBlocks.map((block) => (
            <div key={block.label}>
              <h4 className="text-sm font-medium mb-2">{block.label}</h4>
              <div className="grid grid-cols-6 gap-2">
                {block.hours.map((stat) => (
                  <div key={stat.hour} className="text-center">
                    <div
                      className={`aspect-square rounded flex items-center justify-center text-xs font-semibold ${getIntensityColor(
                        stat.averageAccuracy,
                        stat.sessions
                      )} relative group cursor-pointer`}
                    >
                      {stat.hour}
                      {stat.sessions > 0 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black dark:bg-white text-white dark:text-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {formatHour(stat.hour)}
                          <br />
                          Accuracy: {stat.averageAccuracy}%
                          <br />
                          Sessions: {stat.sessions}
                          <br />
                          Avg Cards: {stat.averageCards}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end mt-6 space-x-2 text-xs text-muted-foreground">
          <span>Low</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded bg-red-500" />
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <div className="w-3 h-3 rounded bg-green-500" />
            <div className="w-3 h-3 rounded bg-green-600" />
          </div>
          <span>High</span>
        </div>
      </CardContent>
    </Card>
  );
}
