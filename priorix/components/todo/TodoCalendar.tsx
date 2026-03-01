"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameDay,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CalendarDayCell from "./CalendarDayCell";
import CalendarWeekView from "./CalendarWeekView";
import CalendarDayView from "./CalendarDayView";
import type { Task } from "@/types/task";

type CalendarView = "month" | "week" | "day";

interface TodoCalendarProps {
  currentDate: Date;
  selectedDate: Date;
  view: CalendarView;
  tasks: Task[];
  onDateChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
}

export default function TodoCalendar({
  currentDate,
  selectedDate,
  view,
  tasks,
  onDateChange,
  onSelectDate,
  onViewChange,
}: TodoCalendarProps) {
  const activeTasks = tasks.filter((t) => t.status !== "completed");

  const navigateBack = () => {
    if (view === "month") onDateChange(subMonths(currentDate, 1));
    else if (view === "week") onDateChange(subWeeks(currentDate, 1));
    else onDateChange(subDays(currentDate, 1));
  };

  const navigateForward = () => {
    if (view === "month") onDateChange(addMonths(currentDate, 1));
    else if (view === "week") onDateChange(addWeeks(currentDate, 1));
    else onDateChange(addDays(currentDate, 1));
  };

  const goToToday = () => {
    const today = new Date();
    onDateChange(today);
    onSelectDate(today);
  };

  const headerLabel = useMemo(() => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  }, [currentDate, view]);

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateBack}
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm sm:text-lg font-semibold text-center truncate">
            {headerLabel}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateForward}
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs h-7 sm:h-8 px-2 sm:px-3"
          >
            Today
          </Button>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["month", "week", "day"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium capitalize transition-colors ${
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="flex-1 min-h-0">
        {view === "month" && (
          <MonthView
            currentDate={currentDate}
            selectedDate={selectedDate}
            tasks={activeTasks}
            onSelectDate={onSelectDate}
          />
        )}
        {view === "week" && (
          <CalendarWeekView
            currentDate={currentDate}
            selectedDate={selectedDate}
            tasks={activeTasks}
            onSelectDate={onSelectDate}
          />
        )}
        {view === "day" && (
          <CalendarDayView
            selectedDate={selectedDate}
            tasks={activeTasks.filter(
              (t) =>
                t.dueDate && isSameDay(new Date(t.dueDate), selectedDate)
            )}
          />
        )}
      </div>
    </div>
  );
}

function MonthView({
  currentDate,
  selectedDate,
  tasks,
  onSelectDate,
}: {
  currentDate: Date;
  selectedDate: Date;
  tasks: Task[];
  onSelectDate: (date: Date) => void;
}) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-0.5 sm:mb-1">
        {dayHeaders.map((day) => (
          <div
            key={day}
            className="text-[11px] sm:text-xs font-medium text-muted-foreground text-center py-1 sm:py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((date) => (
          <CalendarDayCell
            key={date.toISOString()}
            date={date}
            isCurrentMonth={date.getMonth() === currentDate.getMonth()}
            selectedDate={selectedDate}
            tasks={tasks}
            onSelectDate={onSelectDate}
          />
        ))}
      </div>
    </div>
  );
}
