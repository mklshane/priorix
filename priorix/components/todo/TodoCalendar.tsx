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
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 0 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
    });
  }, [currentDate]);

  return (
    <div className="flex flex-col h-full min-h-0 font-sans-utility">
      {/* Editorial Calendar Header */}
      <div className="shrink-0 flex items-center justify-between mb-4 md:mb-6 pb-3 md:pb-4 border-b-2 border-black/80 dark:border-white/80">
        <h2 className="text-xl md:text-2xl font-editorial italic tracking-wider">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => onDateChange(subMonths(currentDate, 1))}
            className="p-1.5 md:p-2 border border-black/80 dark:border-white/80 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDateChange(addMonths(currentDate, 1))}
            className="p-1.5 md:p-2 border border-black/80 dark:border-white/80 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 grid grid-cols-7 border-t border-l border-black/80 dark:border-white/80 bg-black/80 dark:bg-white/80 gap-[1px]"
        style={{ gridTemplateRows: "auto repeat(6, minmax(0, 1fr))" }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-white dark:bg-[#1A1A1A] flex items-center justify-center py-2 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold shrink-0"
          >
            <span className="hidden md:inline">{day}</span>
            <span className="inline md:hidden">{day.charAt(0)}</span>
          </div>
        ))}

        {calendarDays.map((date) => {
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          const dayTasks = activeTasks.filter(
            (t) => t.dueDate && isSameDay(new Date(t.dueDate), date),
          );
          
          const hasTasks = dayTasks.length > 0;

          return (
            <div
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`
                p-1 md:p-2 cursor-pointer transition-all duration-200 flex flex-col relative overflow-hidden
                ${!isCurrentMonth ? "opacity-30 " : ""}
                ${isSelected ? "bg-sky dark:bg-sky " : "bg-white dark:bg-[#1A1A1A] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] "}
              `}
            >
              <div className={`flex justify-between items-start gap-3 w-full ${isSelected ? "mb-1" : ""}`}>
                <span
                  className={`font-editorial text-sm md:text-xl leading-none 
                    ${isToday && !isSelected ? "italic font-bold " : ""}
                    ${isSelected ? "font-bold text-black dark:text-black " : ""}
                    ${hasTasks && !isSelected ? "text-[#D64045] font-bold " : ""}
                  `}
                >
                  {format(date, "d")}
                </span>
                {hasTasks && (
                  <span
                    className={`text-[8px] md:text-[10px] px-1 py-0.5 border leading-none font-sans-utility 
                        ${isSelected ? "border-black/30 dark:border-black/30 font-bold text-black dark:text-black" : "border-black/20 dark:border-white/20 text-[#D64045]"}
                    `}
                  >
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div className="mt-auto pt-1 flex flex-wrap gap-0.5 md:gap-1">
                {dayTasks.slice(0, 3).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 md:w-1.5 md:h-1.5 ${isSelected ? "bg-black/60 dark:bg-black/60" : "bg-[#D64045] opacity-80"}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
