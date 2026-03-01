"use client";

import { useDroppable } from "@dnd-kit/core";
import { isSameDay, isToday, format } from "date-fns";
import type { Task } from "@/types/task";

const PRIORITY_TAG_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  urgent: {
    bg: "bg-red-100 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-500/30",
  },
  high: {
    bg: "bg-orange-100 dark:bg-orange-500/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-500/30",
  },
  medium: {
    bg: "bg-blue-100 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-500/30",
  },
  low: {
    bg: "bg-gray-100 dark:bg-gray-500/20",
    text: "text-gray-600 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-500/30",
  },
};

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

  // Desktop: show up to 2 task tags + overflow
  const maxTags = 2;
  const visibleTags = dayTasks.slice(0, maxTags);
  const tagOverflow = dayTasks.length - maxTags;

  // Mobile: show colored dots
  const maxDots = 4;
  const dotTasks = dayTasks.slice(0, maxDots);
  const dotOverflow = dayTasks.length - maxDots;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelectDate(date)}
      className={`
        relative flex flex-col items-start
        p-0.5 sm:p-1 md:p-1.5
        min-h-[44px] sm:min-h-[60px] md:min-h-[100px]
        rounded-md sm:rounded-lg cursor-pointer
        transition-all duration-200 border
        ${isOver ? "bg-primary/10 border-primary scale-[1.02]" : "border-border/40"}
        ${isSelected ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30" : "hover:bg-muted/40"}
        ${!isCurrentMonth ? "opacity-35" : ""}
        ${dayTasks.length > 0 && !isSelected && isCurrentMonth ? "bg-muted/15" : ""}
      `}
    >
      {/* Date number */}
      <span
        className={`
          text-xs sm:text-sm font-medium
          w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7
          flex items-center justify-center rounded-full mb-0.5 shrink-0
          ${isTodayDate ? "bg-primary text-primary-foreground font-bold" : ""}
          ${isSelected && !isTodayDate ? "text-primary font-semibold" : ""}
          ${!isCurrentMonth ? "text-muted-foreground" : "text-card-foreground"}
        `}
      >
        {date.getDate()}
      </span>

      {/* Desktop: Task title tags */}
      {visibleTags.length > 0 && (
        <div className="hidden md:flex flex-col gap-0.5 w-full min-w-0 mt-0.5">
          {visibleTags.map((task) => {
            const style = PRIORITY_TAG_STYLES[task.priority] || PRIORITY_TAG_STYLES.medium;
            return (
              <div
                key={task._id}
                className={`
                  text-[10px] leading-tight px-1.5 py-[3px] rounded-[4px]
                  truncate w-full border font-medium
                  ${task.color ? "" : `${style.bg} ${style.text} ${style.border}`}
                `}
                style={
                  task.color
                    ? {
                        backgroundColor: `color-mix(in srgb, ${task.color} 18%, transparent)`,
                        color: task.color,
                        borderColor: `color-mix(in srgb, ${task.color} 30%, transparent)`,
                      }
                    : undefined
                }
                title={task.taskTitle}
              >
                {task.dueTime && (
                  <span className="opacity-70">{task.dueTime} </span>
                )}
                {task.taskTitle}
              </div>
            );
          })}
          {tagOverflow > 0 && (
            <span className="text-[10px] text-muted-foreground font-medium pl-1">
              +{tagOverflow} more
            </span>
          )}
        </div>
      )}

      {/* Mobile/Tablet: Colored dots */}
      {dotTasks.length > 0 && (
        <div className="flex md:hidden gap-[3px] mt-0.5 flex-wrap justify-start">
          {dotTasks.map((task) => (
            <div
              key={task._id}
              className={`w-[5px] h-[5px] rounded-full ${
                task.color
                  ? ""
                  : PRIORITY_DOT_COLORS[task.priority] || "bg-blue-500"
              }`}
              style={task.color ? { backgroundColor: task.color } : undefined}
              title={task.taskTitle}
            />
          ))}
          {dotOverflow > 0 && (
            <span className="text-[8px] text-muted-foreground leading-none">
              +{dotOverflow}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
