"use strict";
"use client";

import { useMemo, useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { Plus, ListTodo } from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import TaskCard from "./TaskCard";
import AddEditTaskDialog from "./AddEditTaskDialog";
import { Button } from "@/components/ui/button";
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
      <div className="shrink-0 flex flex-col xl:flex-row xl:items-end justify-between mb-8 pb-6 border-b-2 border-border gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
            Schedule
          </p>
          <h3 className="text-3xl md:text-4xl font-editorial tracking-tight text-foreground">
            {format(selectedDate, "EEEE, MMMM do")}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="appearance-none h-12 rounded-full border-2 border-border bg-background pl-5 pr-12 text-xs font-bold uppercase tracking-widest cursor-pointer text-foreground focus:outline-none focus:ring-0 shadow-sm hover:bg-muted transition-colors"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
              ▼
            </div>
          </div>

          <Button
            className="h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-2 border-border shadow-bento-sm hover:-translate-y-0.5 transition-all uppercase tracking-widest text-xs"
            onClick={() => {
              setEditingTask(null);
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Internal Scrolling Container */}
      <div className="flex-1 min-h-0 overflow-y-auto relative pl-6 md:pl-8 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-border/50 pr-2 pb-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-4 md:gap-6 animate-pulse border-b-2 border-border/30 pb-6 relative before:absolute before:left-[-29px] md:before:left-[calc(-2rem-3px)] before:top-4 before:w-3 before:h-3 before:rounded-full before:bg-border/50 before:border-2 before:border-background"
              >
                <div className="w-12 md:w-16 h-5 bg-muted rounded-md" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 w-3/4 bg-muted rounded-lg" />
                  <div className="h-5 w-1/2 bg-muted rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border-2 border-border shadow-sm mb-6">
              <ListTodo className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <span className="font-editorial text-3xl md:text-4xl text-foreground mb-3">
              Clear Schedule
            </span>
            <p className="uppercase tracking-widest text-xs md:text-sm text-muted-foreground font-bold text-center px-4">
              No tasks planned for this date.
            </p>
            <Button
              variant="outline"
              className="mt-8 h-12 px-8 rounded-full font-bold border-2 border-border shadow-sm hover:shadow-bento-sm transition-all"
              onClick={() => {
                setEditingTask(null);
                setIsAddDialogOpen(true);
              }}
            >
              Create a Task
            </Button>
          </div>
        ) : (
          <>
            <SortableContext
              items={activeTaskIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4">
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
              <div className="mt-10 md:mt-12 pt-8 md:pt-10 border-t-2 border-dashed border-border">
                <h4 className="font-sans font-bold uppercase tracking-widest text-sm md:text-base mb-6 text-foreground/50">
                  Completed
                </h4>
                <div className="flex flex-col gap-4">
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