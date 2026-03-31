"use client";

import { useState } from "react";
import { ArrowRight, CheckSquare, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import TaskCard from "@/components/todo/TaskCard";
import AddEditTaskDialog from "@/components/todo/AddEditTaskDialog";
import {
  useAllTasks,
  useCompleteTask,
  useRestoreTask,
  useDeleteTask,
} from "@/hooks/useTasks";
import type { Task } from "@/types/task";

export default function TodoList() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useAllTasks("todo");
  const completeTask = useCompleteTask();
  const restoreTask = useRestoreTask();
  const deleteTask = useDeleteTask();

  const taskIds = tasks.map((t) => t._id);

  if (isLoading) {
    return <div className="bento-card bg-card h-full min-h-[400px] animate-pulse" />;
  }

  return (
    <div className="bento-card bg-card h-full flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/10 shrink-0">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {tasks.length > 0 ? `${tasks.length} pending` : "Tasks"}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/todo"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            All <ArrowRight className="h-3 w-3" />
          </Link>
          <button
            className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity"
            onClick={() => {
              setEditingTask(null);
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/40 border-2 border-dashed border-border flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/60">All clear</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                No pending tasks.
              </p>
            </div>
            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter}>
            <SortableContext
              items={taskIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      variant="active"
                      onComplete={completeTask.mutate}
                      onRestore={restoreTask.mutate}
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
          </DndContext>
        )}
      </div>

      <AddEditTaskDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        selectedDate={new Date()}
        editingTask={editingTask}
      />
    </div>
  );
}
