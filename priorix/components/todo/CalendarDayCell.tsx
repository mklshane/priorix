"use client";

import { useDroppable } from "@dnd-kit/core";
import { isSameDay, isToday, format } from "date-fns";
import type { Task } from "@/types/task";

const PRIORITY_DOT_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-blue-500",
  low: "bg-gray-400",
};

interface CalendarDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  selectedDate: Date;
  tasks: Task[];
  onSelectDate: (date: Date) => void;
}

export default function CalendarDayCell({
  date,
  isCurrentMonth,
  selectedDate,
  tasks,
  onSelectDate,
}: CalendarDayCellProps) {
  const dateStr = format(date, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dateStr}` });

  const isSelected = isSameDay(date, selectedDate);
  const isTodayDate = isToday(date);
  const dayTasks = tasks.filter(
    (t) => t.dueDate && isSameDay(new Date(t.dueDate), date)
  );

  const maxDots = 3;
  const visibleTasks = dayTasks.slice(0, maxDots);
  const overflow = dayTasks.length - maxDots;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelectDate(date)}
      className={`
        relative flex flex-col items-center justify-start p-0.5 sm:p-1 min-h-[44px] sm:min-h-[60px] md:min-h-[80px] rounded-md sm:rounded-lg cursor-pointer
        transition-all duration-200 border
        ${isOver ? "bg-primary/10 border-primary scale-105" : "border-transparent"}
        ${isSelected ? "bg-primary/15 border-primary/40 ring-1 ring-primary/30" : "hover:bg-muted/50"}
        ${!isCurrentMonth ? "opacity-40" : ""}
      `}
    >
      <span
        className={`
          text-xs sm:text-sm font-medium w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full
          ${isTodayDate ? "bg-primary text-primary-foreground font-bold" : ""}
          ${isSelected && !isTodayDate ? "text-primary font-semibold" : ""}
          ${!isCurrentMonth ? "text-muted-foreground" : "text-card-foreground"}
        `}
      >
        {date.getDate()}
      </span>

      {visibleTasks.length > 0 && (
        <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
          {visibleTasks.map((task) => (
            <div
              key={task._id}
              className={`w-1.5 h-1.5 rounded-full ${
                task.color
                  ? ""
                  : PRIORITY_DOT_COLORS[task.priority] || "bg-blue-500"
              }`}
              style={task.color ? { backgroundColor: task.color } : undefined}
              title={task.taskTitle}
            />
          ))}
        </div>
      )}

      {overflow > 0 && (
        <span className="text-[9px] text-muted-foreground mt-0.5">
          +{overflow}
        </span>
      )}
    </div>
  );
}
