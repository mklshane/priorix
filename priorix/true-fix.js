const fs = require('fs');

const taskCardContent = `
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, X, Check, Clock } from "lucide-react";
import type { Task } from "@/types/task";

const PRIORITY_STYLES: Record<string, { color: string; label: string }> = {
  urgent: { color: "bg-red-500", label: "URGENT" },
  high: { color: "bg-orange-400", label: "HIGH" },
  medium: { color: "bg-blue-400", label: "MED" },
  low: { color: "bg-zinc-400", label: "LOW" },
};

export default function TaskCard({
  task,
  variant = "active",
  onComplete,
  onRestore,
  onDelete,
  onEdit,
}: {
  task: Task;
  variant?: "active" | "completed";
  onComplete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    disabled: variant === "completed",
  });

  const isCompleted = variant === "completed";
  const priorityStyle =
    PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;

  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={\`
        group relative flex items-center gap-3 py-2 px-3 sm:px-4 rounded-xl border border-border bg-card shadow-sm
        \${isDragging ? "opacity-50 ring-2 ring-primary z-10" : "hover:border-primary/30 transition-colors"}
        \${isCompleted ? "opacity-60 bg-muted/30" : ""}
      \`}
    >
      {/* Priority Indicator Line */}
      <div className={\`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl \${isCompleted ? "bg-border" : priorityStyle.color}\`} />

      {/* Drag handle */}
      {!isCompleted && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground touch-none shrink-0 p-1 -ml-1"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Checkbox (Always visible, moved to the left) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          isCompleted && onRestore
            ? onRestore(task._id)
            : onComplete?.(task._id);
        }}
        className={\`
          w-5 h-5 flex items-center justify-center rounded-full border-2 transition-all shrink-0 ml-1 group/btn
          \${isCompleted 
              ? "bg-primary border-primary text-primary-foreground" 
              : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"}
        \`}
      >
        <Check className={\`h-3.5 w-3.5 \${isCompleted ? "opacity-100" : "opacity-0 group-hover/btn:opacity-50 text-primary"}\`} strokeWidth={isCompleted ? 3 : 2} />
      </button>

      {/* Main Content (Title, Time, Tags) */}
      <div 
        className="flex-1 min-w-0 pr-2 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
        onClick={() => !isCompleted && onEdit(task)}
      >
        <div className="flex items-center gap-2 min-w-0">
            <h4
              className={\`
              font-medium text-sm sm:text-base leading-tight truncate
              \${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}
              \`}
            >
              {task.taskTitle}
            </h4>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto shrink-0">
            {task.dueTime && (
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-md">
                    <Clock className="w-3 h-3" />
                    {task.dueTime}
                </div>
            )}
            
            {!isCompleted && (
                <span className={\`text-[9px] sm:text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-md text-white \${priorityStyle.color}\`}>
                    {priorityStyle.label}
                </span>
            )}
        </div>
      </div>

      {/* Actions (Only Delete on right now) */}
      <div className="flex items-center shrink-0">
        <button
          onClick={(e) => {
             e.stopPropagation();
             onDelete(task._id);
          }}
          className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
\`;

fs.writeFileSync('components/todo/TaskCard.tsx', taskCardContent.trim() + '\\n', 'utf8');

const todoCalendarContent = \`
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
      <div className="shrink-0 flex items-center justify-between mb-4 md:mb-6 pb-3 md:pb-4 border-b-2 border-border">
        <h2 className="text-xl md:text-2xl font-editorial italic tracking-wider text-foreground">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => onDateChange(subMonths(currentDate, 1))}
            className="p-1.5 md:p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDateChange(addMonths(currentDate, 1))}
            className="p-1.5 md:p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className="flex-1 min-h-0 grid grid-cols-7 border-t border-l border-border bg-border gap-[1px]"
        style={{ gridTemplateRows: "auto repeat(6, minmax(0, 1fr))" }}
      >
        {/* Days Header */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-card flex items-center justify-center py-2 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold shrink-0 text-muted-foreground"
          >
            <span className="hidden md:inline">{day}</span>
            <span className="inline md:hidden">{day.charAt(0)}</span>
          </div>
        ))}

        {/* Day Cells */}
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
              className={\`
                bg-card p-1 md:p-2 cursor-pointer transition-all duration-200 flex flex-col relative overflow-hidden
                \${!isCurrentMonth ? "opacity-30 " : "hover:bg-muted/50 "}
                \${isSelected ? "bg-mint/80 ring-inset ring-2 ring-mint border-none shadow-sm " : ""}
              \`}
            >
              <div className={\`flex justify-between items-start gap-3 w-full \${isSelected ? "mb-1" : ""}\`}>
                <span
                  className={\`font-editorial text-sm md:text-xl leading-none 
                    \${isToday && !isSelected ? "italic font-bold text-foreground " : "text-foreground "}
                    \${hasTasks && !isSelected ? "text-[var(--primary)] font-bold " : ""}
                  \`}
                >
                  {format(date, "d")}
                </span>
                {hasTasks && (
                  <span
                    className={\`text-[8px] md:text-[10px] px-1.5 py-0.5 border leading-none font-sans-utility rounded-sm
                        \${isSelected ? "border-[var(--primary)]/20 text-[var(--primary)] font-bold bg-white/40" : "border-mint bg-mint/50 text-foreground"}
                    \`}
                  >
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div className="mt-auto pt-1 flex flex-wrap gap-1 md:gap-1.5">
                {dayTasks.slice(0, 3).map((_, i) => (
                  <div
                    key={i}
                    className={\`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full \${isSelected ? "bg-[var(--primary)] opacity-90" : "bg-mint"}\`}
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
\`;

fs.writeFileSync('components/todo/TodoCalendar.tsx', todoCalendarContent.trim() + '\\n', 'utf8');

console.log("Complete");
