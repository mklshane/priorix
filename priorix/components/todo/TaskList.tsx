"use strict";
"use client";

import { useMemo, useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { Plus } from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import TaskCard from "./TaskCard";
import AddEditTaskDialog from "./AddEditTaskDialog";
import {
  useCompleteTask,
  useRestoreTask,
  useDeleteTask,
} from "@/hooks/useTasks";
import type { Task } from "@/types/task";

interface TaskListProps {
  selectedDate: Date;
  tasks: Task[];
  isLoading: boolean;
}

export default function TaskList({
  selectedDate,
  tasks,
  isLoading,
}: TaskListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const completeTask = useCompleteTask();
  const restoreTask = useRestoreTask();
  const deleteTask = useDeleteTask();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add") === "true") {
        setEditingTask(null);
        setIsAddDialogOpen(true);
        window.history.replaceState({}, "", "/todo");
      }
    }
  }, []);

  const { activeTasks, completedTasks } = useMemo(() => {
    const dateTasks = tasks.filter(
      (t) => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate),
    );

    let active = dateTasks.filter((t) => t.status !== "completed");
    const completed = dateTasks.filter((t) => t.status === "completed");

    if (filterPriority !== "all")
      active = active.filter((t) => t.priority === filterPriority);

    active.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const pDiff =
        (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
      if (a.dueTime) return -1;
      if (b.dueTime) return 1;
      return 0;
    });

    return { activeTasks: active, completedTasks: completed };
  }, [tasks, selectedDate, filterPriority]);

  const activeTaskIds = activeTasks.map((t) => t._id);

  return (
    <div className="flex flex-col h-full min-h-0 font-sans relative">
      {/* Header */}
      <div className="shrink-0 flex flex-col lg:flex-row lg:items-end justify-between mb-6 pb-4 border-b-2 border-border gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-foreground/50 mb-1">
            Tasks
          </p>
          <h3 className="text-2xl md:text-3xl font-editorial italic tracking-tight">
            {format(selectedDate, "EEEE, MMMM do")}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative border-2 border-border bg-card rounded-xl shadow-sm">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="appearance-none bg-transparent pl-4 pr-10 py-2.5 text-xs md:text-sm uppercase tracking-widest font-bold focus:outline-none focus:ring-0 cursor-pointer text-foreground"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-foreground/50">
              ▼
            </div>
          </div>

          <button
            className="group flex items-center gap-2 bg-mint text-foreground px-5 py-2.5 rounded-xl uppercase text-xs md:text-sm tracking-widest font-bold hover:bg-mint/90 transition-all border-2 border-border hover:-translate-y-0.5 shadow-sm shrink-0 shadow-bento-sm"
            onClick={() => {
              setEditingTask(null);
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Internal Scrolling Container */}
      <div className="flex-1 min-h-0 overflow-y-auto relative pl-6 md:pl-8 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-border/50 pr-2 pb-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-4 md:gap-6 animate-pulse border-b border-border/50 pb-6 relative before:absolute before:left-[-29px] md:before:left-[calc(-2rem-3px)] before:top-2 before:w-2.5 before:h-2.5 before:rounded-full before:bg-border/50"
              >
                <div className="w-12 md:w-16 h-4 bg-muted rounded" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12">
            <span className="font-editorial italic text-3xl md:text-4xl text-foreground/30 mb-3">
              Clear Schedule
            </span>
            <p className="uppercase tracking-widest text-xs md:text-sm text-foreground/50 font-bold text-center px-4">
              No tasks planned for this date.
            </p>
          </div>
        ) : (
          <>
            <SortableContext
              items={activeTaskIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {activeTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      variant="active"
                      onComplete={completeTask.mutate}
                      onDelete={deleteTask.mutate}
                      onEdit={(t) => {
                        setEditingTask(t);
                        setIsAddDialogOpen(true);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>

            {completedTasks.length > 0 && (
              <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t-2 border-dashed border-border/50">
                <h4 className="font-editorial italic text-xl md:text-2xl mb-4 md:mb-6 text-foreground/40">
                  Completed Tasks
                </h4>
                <div className="flex flex-col gap-3">
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      variant="completed"
                      onRestore={restoreTask.mutate}
                      onDelete={deleteTask.mutate}
                      onEdit={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddEditTaskDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        selectedDate={selectedDate}
        editingTask={editingTask}
      />
    </div>
  );
}
