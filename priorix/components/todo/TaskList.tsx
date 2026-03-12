"use strict";
"use client";

import { useMemo, useState } from "react";
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
    <div className="flex flex-col h-full min-h-0 font-sans-utility relative">
      {/* Header (Shrinks 0 to protect space) */}
      <div className="shrink-0 flex flex-col lg:flex-row lg:items-end justify-between mb-6 pb-4 border-b-2 border-black/80 dark:border-white/80 gap-4">
        <div>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold text-[#D64045] mb-1">
            Manifest
          </p>
          <h3 className="text-2xl md:text-3xl font-editorial italic tracking-tight">
            {format(selectedDate, "EEEE, MMMM do")}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative border border-black/80 dark:border-white/80 bg-transparent">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-xs md:text-sm uppercase tracking-widest font-bold focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">
              ▼
            </div>
          </div>

          <button
            className="group flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 md:px-5 py-1.5 uppercase text-xs md:text-sm tracking-widest font-bold hover:bg-[#D64045] hover:text-white dark:hover:bg-[#D64045] transition-colors border border-black dark:border-white shrink-0"
            onClick={() => {
              setEditingTask(null);
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Append</span>
          </button>
        </div>
      </div>

      {/* Internal Scrolling Container */}
      <div className="flex-1 min-h-0 overflow-y-auto relative pl-6 md:pl-8 before:absolute before:inset-y-0 before:left-0 before:w-[1px] before:bg-black/20 dark:before:bg-white/20 pr-2 pb-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-4 md:gap-6 animate-pulse border-b border-black/10 pb-6 relative before:absolute before:left-[-28px] md:before:left-[-36px] before:top-2 before:w-2 before:h-2 before:bg-black/20 before:rotate-45"
              >
                <div className="w-12 md:w-16 h-4 bg-black/10 dark:bg-white/10" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-3/4 bg-black/10 dark:bg-white/10" />
                  <div className="h-4 w-1/2 bg-black/10 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12">
            <span className="font-editorial italic text-3xl md:text-4xl text-black/20 dark:text-white/20 mb-3">
              Void
            </span>
            <p className="uppercase tracking-[0.2em] text-xs md:text-sm text-black/50 dark:text-white/50 text-center px-4">
              No directives documented for this date.
            </p>
          </div>
        ) : (
          <>
            <SortableContext
              items={activeTaskIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col">
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
              <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-dashed border-black/30 dark:border-white/30">
                <h4 className="font-editorial italic text-xl md:text-2xl mb-4 md:mb-6 text-black/40 dark:text-white/40">
                  Archived Directives
                </h4>
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
