"use client";

import { useMemo } from "react";
import {
  format,
  eachHourOfInterval,
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

function DraggableTaskBlock({ task }: { task: Task }) {
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
        p-2 rounded-md border-l-3 bg-card shadow-sm cursor-grab
        transition-shadow
        ${PRIORITY_BORDER_COLORS[task.priority] || "border-l-blue-500"}
        ${isDragging ? "opacity-50 shadow-lg" : "hover:shadow-md"}
      `}
    >
      <div className="font-medium text-sm truncate">{task.taskTitle}</div>
      {task.dueTime && (
        <div className="text-xs text-muted-foreground mt-0.5">
          {task.dueTime}
        </div>
      )}
      {task.description && (
        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {task.description}
        </div>
      )}
    </div>
  );
}

function DayTimeSlot({
  date,
  hour,
  tasks,
}: {
  date: Date;
  hour: number;
  tasks: Task[];
}) {
  const droppableId = `day-${format(date, "yyyy-MM-dd")}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const slotTasks = tasks.filter((t) => {
    if (!t.dueTime) return false;
    const taskHour = parseInt(t.dueTime.split(":")[0], 10);
    return taskHour === hour;
  });

  return (
    <div className="grid grid-cols-[80px_1fr] border-b border-border/30">
      <div className="p-2 text-sm text-muted-foreground text-right pr-3 border-r border-border/30">
        {format(setHours(new Date(), hour), "h a")}
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[44px] sm:min-h-[60px] p-1 space-y-1 ${
          isOver ? "bg-primary/10" : ""
        }`}
      >
        {slotTasks.map((task) => (
          <DraggableTaskBlock key={task._id} task={task} />
        ))}
      </div>
    </div>
  );
}

interface CalendarDayViewProps {
  selectedDate: Date;
  tasks: Task[];
}

export default function CalendarDayView({
  selectedDate,
  tasks,
}: CalendarDayViewProps) {
  const hours = useMemo(() => {
    const dayStart = setHours(startOfDay(selectedDate), 6);
    const dayEnd = setHours(endOfDay(selectedDate), 23);
    return eachHourOfInterval({ start: dayStart, end: dayEnd });
  }, [selectedDate.getTime()]);

  const dayTasks = tasks.filter((t) => t.dueTime);
  const allDayTasks = tasks.filter((t) => !t.dueTime);

  const allDayDroppableId = `day-${format(selectedDate, "yyyy-MM-dd")}-allday`;
  const { setNodeRef: allDayRef, isOver: allDayIsOver } = useDroppable({
    id: allDayDroppableId,
  });

  return (
    <div className="overflow-auto max-h-[400px] sm:max-h-[600px]">
      {/* Date header */}
      <div className="sticky top-0 bg-card z-10 p-3 border-b border-border">
        <div className="text-lg font-semibold">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </div>
      </div>

      {/* All-day section */}
      {allDayTasks.length > 0 && (
        <div className="grid grid-cols-[80px_1fr] border-b border-border">
          <div className="p-2 text-sm text-muted-foreground text-right pr-3 border-r border-border/30">
            All day
          </div>
          <div
            ref={allDayRef}
            className={`p-1 space-y-1 ${allDayIsOver ? "bg-primary/10" : ""}`}
          >
            {allDayTasks.map((task) => (
              <DraggableTaskBlock key={task._id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Hour slots */}
      {hours.map((hour) => (
        <DayTimeSlot
          key={hour.getTime()}
          date={selectedDate}
          hour={hour.getHours()}
          tasks={dayTasks}
        />
      ))}
    </div>
  );
}
