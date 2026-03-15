"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, X, Check, Clock, Tag } from "lucide-react";
import type { Task } from "@/types/task";

const PRIORITY_STYLES: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  urgent: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
    label: "Urgent",
  },
  high: {
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    label: "High",
  },
  medium: {
    dot: "bg-sky-500",
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    label: "Medium",
  },
  low: {
    dot: "bg-zinc-400",
    badge: "bg-zinc-100 text-zinc-600 border-zinc-200",
    label: "Low",
  },
};

export default function TaskCard({
  task,
  variant = "active",
  onComplete,
  onRestore,
  onDelete,
  onEdit,
}: {
  task: Task;
  variant?: "active" | "completed";
  onComplete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    disabled: variant === "completed",
  });

  const isCompleted = variant === "completed";
  const priorityStyle =
    PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const hasDescription = Boolean(task.description?.trim());
  const hasTags = Array.isArray(task.tags) && task.tags.length > 0;

  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`group relative rounded-2xl border-2 border-border bg-card px-3 py-3 sm:px-4 sm:py-3.5 transition-all ${
        isDragging
          ? "shadow-bento translate-y-0.5"
          : "hover:-translate-y-0.5 hover:shadow-bento"
      } ${isCompleted ? "opacity-75" : ""}`}
    >
      <div className="flex items-start gap-3">
        {!isCompleted && (
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 hidden sm:flex cursor-grab touch-none text-muted-foreground/70 hover:text-foreground transition-colors"
            aria-label="Drag task"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            isCompleted && onRestore
              ? onRestore(task._id)
              : onComplete?.(task._id);
          }}
          className={`mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? "bg-mint border-mint text-foreground"
              : "border-border bg-background hover:bg-mint/30"
          }`}
          aria-label={isCompleted ? "Mark as active" : "Mark as completed"}
        >
          {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>

        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => !isCompleted && onEdit(task)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${priorityStyle.dot}`}
              aria-hidden="true"
            />
            <h4
              className={`truncate text-sm sm:text-base font-semibold leading-tight ${
                isCompleted
                  ? "text-muted-foreground line-through decoration-2"
                  : "text-foreground"
              }`}
            >
              {task.taskTitle}
            </h4>
          </div>

          {hasDescription && (
            <p
              className={`mt-1 line-clamp-2 text-xs sm:text-sm ${
                isCompleted ? "text-muted-foreground/70" : "text-muted-foreground"
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
            {task.dueTime && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5 font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.dueTime}
              </span>
            )}

            {!isCompleted && (
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold ${priorityStyle.badge}`}
              >
                {priorityStyle.label}
              </span>
            )}

            {hasTags && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted px-2 py-0.5 text-muted-foreground">
                <Tag className="h-3 w-3" />
                {task.tags[0]}
                {task.tags.length > 1 ? ` +${task.tags.length - 1}` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task._id);
            }}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Delete task"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
