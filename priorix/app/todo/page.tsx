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

type CalendarView = "month" | "week" | "day";

export default function TodoPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const rescheduleTask = useRescheduleTask();

  // Calculate date range for fetching tasks based on view
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

  // Fetch all tasks (active + completed) for the range
  const { data: tasks = [], isLoading } = useTasksForDateRange(
    rangeStart,
    rangeEnd,
    "all"
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
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

      // Dropped on a day cell in month view: "day-YYYY-MM-DD"
      if (overId.startsWith("day-") && overId.split("-").length === 4) {
        const dateStr = overId.replace("day-", "");
        if (dateStr && taskId) {
          rescheduleTask.mutate({ taskId, dueDate: dateStr });
        }
        return;
      }

      // Dropped on a week time slot: "week-YYYY-MM-DD-HH" or "week-YYYY-MM-DD-allday"
      if (overId.startsWith("week-")) {
        const raw = overId.replace("week-", "");
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
        return;
      }

      // Dropped on a day view time slot: "day-YYYY-MM-DD-HH" or "day-YYYY-MM-DD-allday"
      if (overId.startsWith("day-") && overId.split("-").length > 4) {
        const raw = overId.replace("day-", "");
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
    [rescheduleTask]
  );

  if (sessionStatus === "loading") {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-4 md:p-6 space-y-5">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-5">
          <div className="h-[500px] bg-muted rounded-2xl animate-pulse" />
          <div className="h-[500px] bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-4 md:p-6">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-2">To-Do</h1>
          <p className="text-muted-foreground">
            Please sign in to manage your tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto">

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] lg:grid-cols-[1fr_420px] gap-5 items-start">
          {/* Left: Calendar */}
          <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 md:p-5 min-h-0 md:min-h-[500px] shadow-sm">
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

          {/* Right: Task List */}
          <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 md:p-5 min-h-0 md:min-h-[500px] max-h-[calc(100vh-180px)] md:sticky md:top-4 shadow-sm">
            <TaskList
              selectedDate={selectedDate}
              tasks={tasks}
              isLoading={isLoading}
            />
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-card border border-primary/30 shadow-xl rounded-xl p-3 text-sm max-w-[220px] opacity-95 backdrop-blur-sm">
              <span className="font-medium truncate block">{activeTask.taskTitle}</span>
              {activeTask.dueTime && (
                <span className="text-xs text-muted-foreground mt-0.5 block">{activeTask.dueTime}</span>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
