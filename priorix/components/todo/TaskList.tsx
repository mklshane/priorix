"use client";

import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { Plus, ListTodo, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import TaskCard from "./TaskCard";
import CompletedTasksPanel from "./CompletedTasksPanel";
import AddEditTaskDialog from "./AddEditTaskDialog";
import { useCompleteTask, useRestoreTask, useDeleteTask } from "@/hooks/useTasks";
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

  // Split tasks for selected date into active and completed
  const { activeTasks, completedTasks } = useMemo(() => {
    const dateTasks = tasks.filter(
      (t) => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate)
    );

    let active = dateTasks.filter((t) => t.status !== "completed");
    const completed = dateTasks.filter((t) => t.status === "completed");

    if (filterPriority !== "all") {
      active = active.filter((t) => t.priority === filterPriority);
    }

    // Sort: urgent first, then by dueTime
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

  // Also collect all completed tasks (not just for selected date) for history
  const allCompleted = useMemo(
    () => tasks.filter((t) => t.status === "completed"),
    [tasks]
  );

  const activeTaskIds = activeTasks.map((t) => t._id);

  const handleComplete = (taskId: string) => {
    completeTask.mutate(taskId);
  };

  const handleRestore = (taskId: string) => {
    restoreTask.mutate(taskId);
  };

  const handleDelete = (taskId: string) => {
    deleteTask.mutate(taskId);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsAddDialogOpen(true);
  };

  const dateLabel = format(selectedDate, "EEEE, MMMM d");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <ListTodo className="h-4 w-4 text-primary shrink-0" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate leading-tight">{dateLabel}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            <option value="all">All</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <Button size="sm" className="h-8 rounded-lg text-xs gap-1" onClick={() => { setEditingTask(null); setIsAddDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto pr-0.5 -mr-0.5">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border/40">
                <div className="w-[18px] h-[18px] rounded-full bg-muted animate-pulse mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <ListTodo className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-foreground/70 mb-1">
              No tasks yet
            </p>
            <p className="text-muted-foreground text-xs text-center mb-4">
              Nothing scheduled for {format(selectedDate, "MMM d")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-8 text-xs gap-1"
              onClick={() => { setEditingTask(null); setIsAddDialogOpen(true); }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add a task
            </Button>
          </div>
        ) : (
          <>
            <SortableContext
              items={activeTaskIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {activeTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      variant="active"
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>

            {/* Completed tasks section */}
            <CompletedTasksPanel
              tasks={allCompleted}
              onRestore={handleRestore}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </>
        )}
      </div>

      {/* Add/Edit Dialog */}
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
