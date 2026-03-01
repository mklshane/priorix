"use client";

import { useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachHourOfInterval,
  isSameDay,
  startOfDay,
  endOfDay,
  setHours,
} from "date-fns";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { Task } from "@/types/task";

const PRIORITY_BORDER_COLORS: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-400",
  medium: "border-l-blue-500",
  low: "border-l-gray-400",
};

function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `task-${task._id}`, data: { task } });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`
        text-xs p-1.5 rounded border-l-2 bg-card cursor-grab
        truncate transition-shadow
        ${PRIORITY_BORDER_COLORS[task.priority] || "border-l-blue-500"}
        ${isDragging ? "opacity-50 shadow-lg" : "hover:shadow-sm"}
      `}
      title={task.taskTitle}
    >
      <span className="truncate">{task.taskTitle}</span>
      {task.dueTime && (
        <span className="text-muted-foreground ml-1">{task.dueTime}</span>
      )}
    </div>
  );
}

function TimeSlot({
  date,
  hour,
  tasks,
}: {
  date: Date;
  hour: number;
  tasks: Task[];
}) {
  const droppableId = `week-${format(date, "yyyy-MM-dd")}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const slotTasks = tasks.filter((t) => {
    if (!t.dueTime) return false;
    const taskHour = parseInt(t.dueTime.split(":")[0], 10);
    return taskHour === hour;
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[36px] sm:min-h-[48px] border-b border-border/30 p-0.5
        ${isOver ? "bg-primary/10" : ""}
      `}
    >
      {slotTasks.map((task) => (
        <DraggableTask key={task._id} task={task} />
      ))}
    </div>
  );
}

interface CalendarWeekViewProps {
  currentDate: Date;
  selectedDate: Date;
  tasks: Task[];
  onSelectDate: (date: Date) => void;
}

export default function CalendarWeekView({
  currentDate,
  selectedDate,
  tasks,
  onSelectDate,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    let day = weekStart;
    while (day <= weekEnd) {
      days.push(day);
      day = new Date(day);
      day.setDate(day.getDate() + 1);
    }
    return days;
  }, [weekStart.getTime(), weekEnd.getTime()]);

  const hours = useMemo(() => {
    const dayStart = setHours(startOfDay(currentDate), 6);
    const dayEnd = setHours(endOfDay(currentDate), 23);
    return eachHourOfInterval({ start: dayStart, end: dayEnd });
  }, [currentDate.getTime()]);

  const allDayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    return !t.dueTime;
  });

  const getTasksForDay = (day: Date) =>
    tasks.filter(
      (t) => t.dueDate && isSameDay(new Date(t.dueDate), day)
    );

  const getAllDayTasksForDay = (day: Date) =>
    allDayTasks.filter(
      (t) => t.dueDate && isSameDay(new Date(t.dueDate), day)
    );

  return (
    <div className="overflow-auto max-h-[400px] sm:max-h-[600px]">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 bg-card z-10 border-b border-border">
        <div className="p-2 text-xs text-muted-foreground" />
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`
                p-2 text-center transition-colors
                ${isSelected ? "bg-primary/10" : "hover:bg-muted/50"}
              `}
            >
              <div className="text-xs text-muted-foreground">
                {format(day, "EEE")}
              </div>
              <div
                className={`text-sm font-medium ${
                  isSelected ? "text-primary" : ""
                }`}
              >
                {format(day, "d")}
              </div>
            </button>
          );
        })}
      </div>

      {/* All-day row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div className="p-1 text-[10px] text-muted-foreground flex items-center justify-end pr-2">
          All day
        </div>
        {weekDays.map((day) => {
          const dayAllDay = getAllDayTasksForDay(day);
          const droppableId = `week-${format(day, "yyyy-MM-dd")}-allday`;
          return (
            <AllDayDroppable
              key={day.toISOString()}
              droppableId={droppableId}
              tasks={dayAllDay}
            />
          );
        })}
      </div>

      {/* Time grid */}
      {hours.map((hour) => (
        <div
          key={hour.getTime()}
          className="grid grid-cols-[60px_repeat(7,1fr)]"
        >
          <div className="p-1 text-[10px] text-muted-foreground text-right pr-2 border-r border-border/30">
            {format(hour, "h a")}
          </div>
          {weekDays.map((day) => (
            <TimeSlot
              key={`${day.toISOString()}-${hour.getHours()}`}
              date={day}
              hour={hour.getHours()}
              tasks={getTasksForDay(day)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function AllDayDroppable({
  droppableId,
  tasks,
}: {
  droppableId: string;
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[32px] p-0.5 border-r border-border/30 ${
        isOver ? "bg-primary/10" : ""
      }`}
    >
      {tasks.map((task) => (
        <DraggableTask key={task._id} task={task} />
      ))}
    </div>
  );
}
