"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSidebar } from "@/contexts/SidebarContext";

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
    if (cards === 0) return "bg-gray-200 dark:bg-gray-800";
    if (cards < 10) return "bg-green/20 dark:bg-green/10";
    if (cards < 25) return "bg-green/40 dark:bg-green/20";
    if (cards < 50) return "bg-green/60 dark:bg-green/40";
    return "bg-green dark:bg-green/60";
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
        maxWeeksToShow = sidebarCollapsed ? 40 : 35;
      } else if (viewportWidth >= 1024) {
        // Laptop: 25 weeks open, 30 weeks collapsed
        maxWeeksToShow = sidebarCollapsed ? 30 : 26;
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
    const paddingHorizontal = mobile ? 32 : 48; // Mobile: px-2 + px-2 = 32px, Desktop: px-2 + sm:px-4 = 48px
    const availableWidth = width - totalGaps - paddingHorizontal;
    const computedBoxSize = Math.floor(availableWidth / numWeekCols);
    
    // Width: On mobile, use computed size without minimum; on desktop, cap at 22px
    setBoxWidth(
      mobile ? computedBoxSize : Math.max(16, Math.min(computedBoxSize, 22)),
    );
    
    // Height: Keep reasonable height on mobile
    setBoxHeight(
      mobile ? 26 : Math.max(16, Math.min(computedBoxSize, 22)),
    );
  };

  useEffect(() => {
    // Initial computation with small delay to ensure ref is ready
    const timer = setTimeout(() => computeGrid(), 0);
    
    window.addEventListener("resize", computeGrid);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", computeGrid);
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
    "bg-gray-200 dark:bg-gray-800",
    "bg-green/20 dark:bg-green/10",
    "bg-green/40 dark:bg-green/20",
    "bg-green/60 dark:bg-green/40",
    "bg-green dark:bg-green/60",
  ];

  const monthGapWidth = isMobile ? 8 : 10;

  return (
    <div className="w-full min-w-0" ref={containerRef}>
      <Card className="bg-white dark:bg-card border-2 border-black dark:border-darkborder rounded-xl overflow-hidden px-2">
        {/* Header */}
        <CardContent className="p-0 md:p-3 sm:p-4 pb-2  ">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold font-sora">
              Study Activity
            </h3>
            <div className="text-[11px] sm:text-xs text-muted-foreground hidden md:block">
              {gridCols.length} weeks
            </div>
          </div>
        </CardContent>

        {/* Month labels */}
        <div className="overflow-x-auto flex justify-center">
          <div
            className="grid items-end mb-2 text-muted-foreground font-sora px-2 sm:px-4 mt-2 md:mt-0"
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
        <div className="px-2 sm:px-4 pb-3 overflow-x-auto flex justify-center">
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
                        className={`relative group rounded-[5px] cursor-pointer ${isFuture ? "bg-transparent border border-dashed border-gray-300 dark:border-gray-600" : getIntensityColor(day.cardsStudied)} transition-all hover:ring-2 hover:ring-green hover:z-10`}
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
