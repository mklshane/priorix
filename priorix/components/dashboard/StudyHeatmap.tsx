"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

interface DailyStats {
  date: string;
  cardsStudied: number;
  studyTime: number;
  accuracy: number;
  sessions: number;
}

async function fetchDailyStats(userId: string): Promise<DailyStats[]> {
  const res = await fetch(`/api/analytics/user-stats?userId=${userId}&period=60`);
  if (!res.ok) throw new Error("Failed to fetch daily stats");
  const data = await res.json();
  return data.dailyBreakdown || [];
}

export default function StudyHeatmap() {
  const { data: session } = useSession();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["daily-stats", session?.user?.id],
    queryFn: () => fetchDailyStats(session!.user!.id),
    enabled: !!session?.user?.id,
    staleTime: 60_000, // 1 minute
  });

  const getIntensityColor = (cards: number) => {
    if (cards === 0) return "bg-gray-200 dark:bg-gray-800";
    if (cards < 10) return "bg-green-200 dark:bg-green-900/40";
    if (cards < 25) return "bg-green-400 dark:bg-green-700/60";
    if (cards < 50) return "bg-green-600 dark:bg-green-600/80";
    return "bg-green-700 dark:bg-green-500";
  };

  // Generate weeks array like GitHub (columns of 7 days)
  const getWeeksData = () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    // Adjust to start on Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    const weeks: DailyStats[][] = [];
    let currentWeek: DailyStats[] = [];
    
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingDay = stats?.find(s => s.date.startsWith(dateStr));
      
      const dayData = existingDay || {
        date: dateStr,
        cardsStudied: 0,
        studyTime: 0,
        accuracy: 0,
        sessions: 0,
      };
      
      currentWeek.push(dayData);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add remaining days if any
    if (currentWeek.length > 0) {
      // Fill incomplete week with empty days
      while (currentWeek.length < 7) {
        const nextDate = new Date(currentDate);
        currentWeek.push({
          date: nextDate.toISOString().split('T')[0],
          cardsStudied: 0,
          studyTime: 0,
          accuracy: 0,
          sessions: 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  // Get month labels for each week
  const getMonthLabels = (weeks: DailyStats[][]) => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = '';
    
    weeks.forEach((week, index) => {
      const firstDay = new Date(week[0].date);
      const month = firstDay.toLocaleDateString('en-US', { month: 'short' });
      
      if (month !== lastMonth) {
        labels.push({ month, weekIndex: index });
        lastMonth = month;
      }
    });
    
    return labels;
  };

  const weeks = getWeeksData();
  const monthLabels = getMonthLabels(weeks);
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="border-2 border-black dark:border-darkborder">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="h-4 w-4" />
          <h3 className="text-sm font-bold font-sora">Study Activity</h3>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Month labels */}
              <div className="flex ml-7 mb-1">
                {monthLabels.map(({ month, weekIndex }) => (
                  <div
                    key={`${month}-${weekIndex}`}
                    className="text-[10px] text-muted-foreground font-medium"
                    style={{ 
                      marginLeft: weekIndex === 0 ? '0px' : '0px',
                      width: '13px',
                      position: 'relative',
                      left: `${weekIndex * 13}px`
                    }}
                  >
                    {month}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="flex">
                {/* Day labels */}
                <div className="flex flex-col justify-between mr-1 text-[9px] text-muted-foreground">
                  <div></div>
                  <div>Mon</div>
                  <div></div>
                  <div>Wed</div>
                  <div></div>
                  <div>Fri</div>
                  <div></div>
                </div>
                
                {/* Weeks as columns */}
                <div className="flex gap-[2px]">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[2px]">
                      {week.map((day, dayIndex) => {
                        const date = new Date(day.date);
                        const today = new Date();
                        const isFuture = date > today;
                        const dayName = date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                        
                        return (
                          <div
                            key={dayIndex}
                            className={`w-[11px] h-[11px] rounded-[2px] ${
                              isFuture 
                                ? 'bg-transparent border border-dashed border-gray-300 dark:border-gray-700' 
                                : getIntensityColor(day.cardsStudied)
                            } group relative cursor-pointer transition-all hover:ring-1 hover:ring-primary/50 hover:scale-110`}
                            title={isFuture ? 'Future date' : `${dayName}: ${day.cardsStudied} cards`}
                          >
                            {/* Tooltip */}
                            {!isFuture && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-black dark:bg-gray-900 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 border border-gray-700">
                                <div className="font-semibold">{dayName}</div>
                                <div className="text-gray-300 text-[9px]">
                                  {day.cardsStudied} cards
                                  {day.sessions > 0 && ` • ${day.sessions} sessions`}
                                </div>
                                {day.studyTime > 0 && (
                                  <div className="text-gray-400 text-[8px]">{day.studyTime} min</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

            {/* Legend */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground">Less</span>
                <div className="flex gap-[2px]">
                  <div className="w-[11px] h-[11px] rounded-[2px] bg-gray-200 dark:bg-gray-800" />
                  <div className="w-[11px] h-[11px] rounded-[2px] bg-green-200 dark:bg-green-900/40" />
                  <div className="w-[11px] h-[11px] rounded-[2px] bg-green-400 dark:bg-green-700/60" />
                  <div className="w-[11px] h-[11px] rounded-[2px] bg-green-600 dark:bg-green-600/80" />
                  <div className="w-[11px] h-[11px] rounded-[2px] bg-green-700 dark:bg-green-500" />
                </div>
                <span className="text-[9px] text-muted-foreground">More</span>
              </div>
            </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
