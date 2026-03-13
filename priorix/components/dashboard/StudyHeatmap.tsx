"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon } from "lucide-react";

interface DailyStats {
  date: string;
  cardsStudied: number;
  studyTime: number;
  accuracy: number;
  sessions: number;
}

async function fetchDailyStats(userId: string): Promise<DailyStats[]> {
  const res = await fetch(
    `/api/analytics/user-stats?userId=${userId}&period=60`,
  );
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
    staleTime: 60_000,
  });

  const getIntensityColor = (cards: number) => {
    if (cards === 0) return "bg-muted dark:bg-muted/20";
    if (cards < 10) return "bg-mint/40";
    if (cards < 25) return "bg-mint/70";
    if (cards < 50) return "bg-mint";
    return "bg-mint border-2 border-black/20";
  };

  const getWeeksData = () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const weeks: DailyStats[][] = [];
    let currentWeek: DailyStats[] = [];
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const existingDay = stats?.find((s) => s.date.startsWith(dateStr));
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

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        const nextDate = new Date(currentDate);
        currentWeek.push({
          date: nextDate.toISOString().split("T")[0],
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

  const getMonthLabels = (weeks: DailyStats[][]) => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = "";
    weeks.forEach((week, index) => {
      const firstDay = new Date(week[0].date);
      const month = firstDay.toLocaleDateString("en-US", { month: "short" });
      if (month !== lastMonth) {
        labels.push({ month, weekIndex: index });
        lastMonth = month;
      }
    });
    return labels;
  };

  const weeks = getWeeksData();
  const monthLabels = getMonthLabels(weeks);

  return (
    <div className="bento-card bg-card p-6 h-full flex flex-col font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-mint border-2 border-border flex items-center justify-center shadow-bento-sm">
          <CalendarIcon className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-editorial italic">Study Activity</h3>
      </div>

      {isLoading ? (
        <div className="animate-pulse flex-1 bg-muted/30 rounded-2xl" />
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-full">
            <div className="flex ml-8 mb-2 relative h-4">
              {monthLabels.map(({ month, weekIndex }) => (
                <div
                  key={`${month}-${weekIndex}`}
                  className="text-[10px] uppercase tracking-widest font-bold absolute"
                  style={{ left: `${weekIndex * 15}px` }}
                >
                  {month}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col justify-between py-1 text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">
                <span>Sun</span>
                <span>Tue</span>
                <span>Thu</span>
                <span>Sat</span>
              </div>
              <div className="flex gap-[3px]">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dIdx) => {
                      const isFuture = new Date(day.date) > new Date();
                      return (
                        <div
                          key={dIdx}
                          className={`w-[12px] h-[12px] rounded-[3px] transition-all hover:scale-125 hover:z-10 cursor-help ${isFuture ? "bg-transparent border border-dashed border-border/30" : getIntensityColor(day.cardsStudied)} group relative`}
                          title={`${day.date}: ${day.cardsStudied} cards`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
