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
    <>
      {/* Scoped Typography Injection */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Jost:ital,wght@0,300..700;1,300..700&display=swap');
        .font-editorial { font-family: 'Bodoni Moda', serif; }
        .font-sans-utility { font-family: 'Jost', sans-serif; }
      `,
        }}
      />

      {/* 100dvh constraint wrapper with scoped colors */}
      <div className="w-full h-[calc(100dvh-2rem)] md:h-[calc(100dvh-3rem)] flex flex-col mx-auto px-4 md:px-8 py-4 md:py-6 font-sans-utility bg-[#F6F4F0] dark:bg-[#111111] text-[#1A1A1A] dark:text-[#EFEFEF] selection:bg-[#D64045] selection:text-white rounded-xl md:rounded-2xl overflow-hidden border border-border/50">
        {/* Adjusted Editorial Header */}
        <header className="shrink-0 mb-6 pb-4 border-b-2 border-black/80 dark:border-white/80 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl md:text-7xl font-editorial italic leading-none tracking-tighter pr-4">
              Agenda
            </h1>
            <p className="text-xs md:text-sm uppercase tracking-[0.3em] mt-3 font-medium text-black/60 dark:text-white/60">
              Master Ledger • Vol {format(new Date(), "yy")}
            </p>
          </div>
          <div className="text-left md:text-right hidden sm:block">
            <p className="font-editorial text-2xl md:text-3xl">
              {format(currentDate, "MMMM")}
            </p>
            <p className="text-sm uppercase tracking-widest">
              {format(currentDate, "yyyy")}
            </p>
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Main Grid: min-h-0 is crucial for inner scrolling in flex parents */}
          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8 md:gap-12 items-start">
            {/* Left Column: Calendar */}
            <div className="h-full max-h-full flex flex-col border border-black/80 dark:border-white/80 p-4 md:p-6 bg-white dark:bg-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] dark:shadow-[4px_4px_0px_0px_#D64045]">
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

            {/* Right Column: Ledger Tasks (Internal Scroll) */}
            <div className="h-full flex flex-col min-h-0">
              <TaskList
                selectedDate={selectedDate}
                tasks={tasks}
                isLoading={isLoading}
              />
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="border-2 border-[#D64045] bg-white dark:bg-black p-3 md:p-4 shadow-[4px_4px_0px_0px_#D64045] font-editorial text-base md:text-lg italic rotate-2">
                {activeTask.taskTitle}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}
