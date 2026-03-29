"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subDays,
  addDays,
} from "date-fns";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useTasksForDateRange, useRescheduleTask } from "@/hooks/useTasks";
import TodoCalendar from "@/components/todo/TodoCalendar";
import TaskList from "@/components/todo/TaskList";
import type { Task } from "@/types/task";
import { CalendarDays } from "lucide-react";

type CalendarView = "month" | "week" | "day";

export default function TodoPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const rescheduleTask = useRescheduleTask();

  const { rangeStart, rangeEnd } = useMemo(() => {
    let start: Date;
    let end: Date;

    if (calendarView === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      start = startOfWeek(monthStart, { weekStartsOn: 0 });
      end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    } else if (calendarView === "week") {
      start = startOfWeek(currentDate, { weekStartsOn: 0 });
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
    } else {
      start = subDays(selectedDate, 1);
      end = addDays(selectedDate, 1);
    }

    return {
      rangeStart: format(start, "yyyy-MM-dd"),
      rangeEnd: format(end, "yyyy-MM-dd"),
    };
  }, [currentDate, selectedDate, calendarView]);

  const { data: tasks = [], isLoading } = useTasksForDateRange(
    rangeStart,
    rangeEnd,
    "all",
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = active.data?.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const overId = String(over.id);
      const taskId = String(active.id).replace("task-", "");

      if (overId.startsWith("day-") && overId.split("-").length === 4) {
        const dateStr = overId.replace("day-", "");
        if (dateStr && taskId) {
          rescheduleTask.mutate({ taskId, dueDate: dateStr });
        }
        return;
      }

      if (
        overId.startsWith("week-") ||
        (overId.startsWith("day-") && overId.split("-").length > 4)
      ) {
        const raw = overId.replace(/^(week|day)-/, "");
        const lastDash = raw.lastIndexOf("-");
        const dateStr = raw.substring(0, lastDash);
        const timeOrAllDay = raw.substring(lastDash + 1);

        if (timeOrAllDay === "allday") {
          rescheduleTask.mutate({ taskId, dueDate: dateStr });
        } else {
          const hour = parseInt(timeOrAllDay, 10);
          if (!isNaN(hour)) {
            const dueTime = `${String(hour).padStart(2, "0")}:00`;
            rescheduleTask.mutate({ taskId, dueDate: dateStr, dueTime });
          }
        }
      }
    },
    [rescheduleTask],
  );

  if (sessionStatus === "loading") return null;

  return (
    <div className="space-y-8 mx-auto pb-12 font-sans selection:bg-mint selection:text-foreground">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-border bg-tangerine/30 shadow-sm text-xs font-bold uppercase tracking-widest text-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> Agenda • {format(new Date(), "yyyy")}
          </div>
          <h1 className="text-4xl md:text-5xl font-editorial tracking-tight text-foreground">
            Tasks
          </h1>
        </div>
        <div className="text-left md:text-right hidden sm:block">
          <p className="text-2xl md:text-3xl font-editorial italic text-muted-foreground">
            {format(currentDate, "MMMM")}
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[450px_1fr] gap-6 items-start">
          <div className="border-2 border-border rounded-3xl bg-card p-6 h-full flex flex-col shrink-0 overflow-hidden shadow-bento-sm hover:shadow-bento transition-shadow">
            <TodoCalendar
              currentDate={currentDate}
              selectedDate={selectedDate}
              view={calendarView}
              tasks={tasks}
              onDateChange={setCurrentDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setCurrentDate(date);
              }}
              onViewChange={setCalendarView}
            />
          </div>

          <div className="border-2 border-border rounded-3xl bg-card p-6 md:p-8 flex flex-col min-h-[600px] shadow-bento-sm hover:shadow-bento transition-shadow">
            <TaskList
              selectedDate={selectedDate}
              tasks={tasks}
              isLoading={isLoading}
            />
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rounded-2xl bg-mint border-2 border-border p-4 shadow-bento font-bold font-sans text-base md:text-lg rotate-3 opacity-95 scale-105">
              {activeTask.taskTitle}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}