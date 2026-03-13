"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSidebar } from "@/contexts/SidebarContext";
import { Calendar } from "lucide-react";

interface HeatmapCalendarProps {
  dailyStats: Array<{
    date: string;
    cardsStudied: number;
    studyTime: number;
    accuracy: number;
    sessions: number;
  }>;
}

type DayData = {
  date: string;
  cardsStudied: number;
  studyTime: number;
  accuracy: number;
  sessions: number;
};

type GridCol = { type: "week"; week: DayData[] } | { type: "gap"; id: string };

export default function HeatmapCalendar({ dailyStats }: HeatmapCalendarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, isMobile: isSidebarMobile } = useSidebar();

  const [boxWidth, setBoxWidth] = useState(18);
  const [boxHeight, setBoxHeight] = useState(18);
  const [gapSize, setGapSize] = useState(3);
  const [gridCols, setGridCols] = useState<GridCol[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    content: string;
    x: number;
    y: number;
  }>({ visible: false, content: "", x: 0, y: 0 });

  const getIntensityColor = (cards: number) => {
    if (cards === 0) return "bg-gray-200 dark:bg-[#2A2A2A]";

    if (cards < 50) return "bg-emerald-400/20 dark:bg-emerald-400/20";
    if (cards < 100) return "bg-emerald-400/40 dark:bg-emerald-400/40";
    if (cards < 150) return "bg-emerald-400/60 dark:bg-emerald-400/60";
    if (cards < 200) return "bg-emerald-400/80 dark:bg-emerald-400/80";
    if (cards < 250) return "bg-emerald-400 dark:bg-emerald-500";
    if (cards < 325) return "bg-emerald-500 dark:bg-emerald-600";
    if (cards < 400) return "bg-emerald-600 dark:bg-emerald-700";
    if (cards < 450) return "bg-emerald-700 dark:bg-emerald-800";

    return "bg-emerald-800 dark:bg-emerald-900";
  };

  // 🔹 Compute weeks and box size dynamically to fill container
  const computeGrid = () => {
    if (!containerRef.current) return; // Wait for ref to be available
    
    const width = containerRef.current.clientWidth;
    const mobile = width < 640;
    setIsMobile(mobile);

    const gap = mobile ? 2 : 3;
    setGapSize(gap);
    const monthGapWidth = mobile ? 8 : 10;

    // Start from today going backward
    const today = new Date();
    
    // Determine weeks based on screen width and sidebar state
    let maxWeeksToShow: number;
    
    if (mobile) {
      // Mobile: 7 weeks
      maxWeeksToShow = 7;
    } else {
      // Get viewport width for device detection
      const viewportWidth = window.innerWidth;
      const sidebarCollapsed = !isSidebarMobile && !isOpen;
      
      if (viewportWidth >= 1440) {
        // Desktop: 35 weeks open, 40 weeks collapsed
        maxWeeksToShow = sidebarCollapsed ? 52 : 48;
      } else if (viewportWidth >= 1024) {
        // Laptop: 25 weeks open, 30 weeks collapsed
        maxWeeksToShow = sidebarCollapsed ? 42 : 36;
      } else {
        // Tablet: 20 weeks open, 23 weeks collapsed
        maxWeeksToShow = sidebarCollapsed ? 23 : 20;
      }
    }
    
    const weeks: DayData[][] = [];

    let currentDate = new Date(today);
    // Move back maxWeeksToShow * 7 days
    currentDate.setDate(currentDate.getDate() - maxWeeksToShow * 7 + 1);

    // Align to Sunday
    const dayOfWeek = currentDate.getDay();
    currentDate.setDate(currentDate.getDate() - dayOfWeek);

    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    let currentWeek: DayData[] = [];
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const existingDay = dailyStats.find((s) => s.date.startsWith(dateStr));
      const dayData: DayData = existingDay || {
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
        const dateStr = currentDate.toISOString().split("T")[0];
        currentWeek.push({
          date: dateStr,
          cardsStudied: 0,
          studyTime: 0,
          accuracy: 0,
          sessions: 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(currentWeek);
    }

    // Build grid columns with month gaps
    const cols: GridCol[] = [];
    let lastMonth = "";
    weeks.forEach((week, idx) => {
      const firstDay = new Date(week[0].date);
      const month = firstDay.toLocaleDateString("en-US", { month: "short" });
      if (idx !== 0 && month !== lastMonth) {
        cols.push({ type: "gap", id: `gap-${idx}` });
      }
      cols.push({ type: "week", week });
      lastMonth = month;
    });

    setGridCols(cols);

    // Compute box size to perfectly fit container width
    const numGapCols = cols.filter((c) => c.type === "gap").length;
    const numWeekCols = cols.filter((c) => c.type === "week").length;
    const totalGaps = (cols.length - 1) * gap + numGapCols * monthGapWidth;
    const paddingHorizontal = mobile ? 32 : 48; // Mobile: p-4 * 2 = 32px, Desktop: p-6 * 2 = 48px
    const availableWidth = width - totalGaps - paddingHorizontal;
    const computedBoxSize = Math.floor(availableWidth / numWeekCols);
    
    // Width: On mobile, use computed size without minimum; on desktop, cap at 28px
    setBoxWidth(
      mobile ? computedBoxSize : Math.max(16, Math.min(computedBoxSize, 28)),
    );

    // Height: Keep reasonable height on mobile
    setBoxHeight(
      mobile ? 26 : Math.max(16, Math.min(computedBoxSize, 28)),
    );
  };

  useEffect(() => {
    // We use a ResizeObserver to perfectly track the container's width changes.
    // This solves the problem where the sidebar opening/closing causes glitches,
    // because the transition takes time and a single recalculation isn't enough.
    const element = containerRef.current;
    if (!element) return;

    let resizeTimer: NodeJS.Timeout;
    const observer = new ResizeObserver(() => {
      // Debounce slightly to avoid rapid recalculation during fluid transitions 
      // (like the sidebar sliding open/closed)
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        computeGrid();
      }, 50);
    });

    observer.observe(element);

    // Initial compute
    const initTimer = setTimeout(() => computeGrid(), 0);
    
    return () => {
      clearTimeout(resizeTimer);
      clearTimeout(initTimer);
      observer.disconnect();
    };
  }, [dailyStats, isOpen]); // Re-run when sidebar state changes

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; year: number; startCol: number; endCol: number }[] = [];
    let currentMonth = "";
    let currentYear = 0;
    let startCol = 0;
    gridCols.forEach((col, i) => {
      if (col.type === "gap") return;
      const firstDay = new Date(col.week[0].date);
      const month = firstDay.toLocaleDateString("en-US", { month: "short" });
      const year = firstDay.getFullYear();
      if (!currentMonth) {
        currentMonth = month;
        currentYear = year;
        startCol = i;
        return;
      }
      if (month !== currentMonth || year !== currentYear) {
        labels.push({ month: currentMonth, year: currentYear, startCol, endCol: i - 1 });
        currentMonth = month;
        currentYear = year;
        startCol = i;
      }
    });
    if (currentMonth) {
      labels.push({ month: currentMonth, year: currentYear, startCol, endCol: gridCols.length - 1 });
    }
    return labels;
  }, [gridCols]);

  const legendClasses = [
    "bg-gray-200 dark:bg-[#2A2A2A]",
    "bg-emerald-400/20 dark:bg-emerald-400/20",
    "bg-emerald-400/40 dark:bg-emerald-400/40",
    "bg-emerald-400/60 dark:bg-emerald-400/60",
    "bg-emerald-400/80 dark:bg-emerald-400/80",
    "bg-emerald-400 dark:bg-emerald-500",
    "bg-emerald-500 dark:bg-emerald-600",
    "bg-emerald-600 dark:bg-emerald-700",
    "bg-emerald-700 dark:bg-emerald-800",
    "bg-emerald-800 dark:bg-emerald-900",
  ];

  const monthGapWidth = isMobile ? 8 : 10;

  return (
    <div className="w-full min-w-0" ref={containerRef}>
      <Card className="bento-card bg-white dark:bg-card border-2 border-black dark:border-darkborder p-4 md:p-6">
        {/* Header */}
        <CardContent className="p-0 pb-0 md:pb-6">
            <div className="flex items-center gap-3 shrink-0 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blush border-2 border-border flex items-center justify-center shadow-bento-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-editorial italic">Study Activity</h3>
              </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground hidden md:block">
              {gridCols.length} weeks
            </div>
          </div>
        </CardContent>

        {/* Month labels */}
        <div className="overflow-x-auto flex justify-center">
          <div
            className="grid items-end mb-2 text-muted-foreground font-sora mt-2 md:mt-0"
            style={{
            gridTemplateColumns: gridCols
              .map((c) =>
                c.type === "gap" ? `${monthGapWidth}px` : `${boxWidth}px`,
              )
              .join(" "),
            columnGap: `${gapSize}px`,
          }}
        >
          {monthLabels.map((m, idx) => (
            <div
              key={`${m.month}-${m.year}-${idx}`}
              className="text-[11px] sm:text-sm font-semibold"
              style={{ gridColumn: `${m.startCol + 1} / ${m.endCol + 2}` }}
            >
              {m.month}
            </div>
          ))}
        </div>
        </div>

        {/* Heatmap */}
        <div className="pb-3 overflow-x-auto flex justify-center w-full">
          <div
            className="grid"
            style={{
              gridTemplateColumns: gridCols
                .map((c) =>
                  c.type === "gap" ? `${monthGapWidth}px` : `${boxWidth}px`,
                )
                .join(" "),
              columnGap: `${gapSize}px`,
            }}
          >
            {gridCols.map((col, colIndex) => {
              if (col.type === "gap") return <div key={col.id} />;
              return (
                <div
                  key={colIndex}
                  className="grid"
                  style={{
                    gridTemplateRows: `repeat(7, ${boxHeight}px)`,
                    rowGap: `${gapSize}px`,
                  }}
                >
                  {col.week.map((day, dayIndex) => {
                    const date = new Date(day.date);
                    const today = new Date();
                    const isFuture = date > today;
                    const dayName = date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                    return (
                      <div
                        key={dayIndex}
                        className={`relative group rounded-[5px] cursor-pointer ${isFuture ? "bg-transparent border border-dashed border-gray-300 dark:border-gray-600" : getIntensityColor(day.cardsStudied)} transition-all hover:ring-2 hover:ring-emerald-500 hover:z-10`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            visible: true,
                            content: isFuture
                              ? "Future date"
                              : `${dayName}: ${day.cardsStudied} cards`,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onMouseLeave={() => {
                          setTooltip({
                            visible: false,
                            content: "",
                            x: 0,
                            y: 0,
                          });
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="px-3 sm:px-5 pt-2 border-t border-border bg-muted/40 dark:bg-background/40">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span className="text-[11px] sm:text-sm text-muted-foreground font-sora">
              Less
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              {legendClasses.map((cls, idx) => (
                <div
                  key={idx}
                  className={`rounded-md border border-black/10 dark:border-darkborder ${cls}`}
                  style={{
                    width: isMobile ? "14px" : `${boxWidth}px`,
                    height: isMobile ? "14px" : `${boxHeight}px`,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] sm:text-sm text-muted-foreground font-sora">
              More
            </span>
          </div>
        </div>
      </Card>

      {/* Custom Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.content}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}
    </div>
  );
}
