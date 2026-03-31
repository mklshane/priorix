"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, X, Check, Clock, Tag, Library, FileText } from "lucide-react";
import type { Task } from "@/types/task";

const PRIORITY_STYLES: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  urgent: {
    dot: "bg-red-500",
    badge: "bg-blush border-border text-foreground",
    label: "Urgent",
  },
  high: {
    dot: "bg-orange-500",
    badge: "bg-tangerine border-border text-foreground",
    label: "High",
  },
  medium: {
    dot: "bg-sky-500",
    badge: "bg-sky border-border text-foreground",
    label: "Medium",
  },
  low: {
    dot: "bg-zinc-400",
    badge: "bg-muted border-border text-foreground",
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
      className={`group relative rounded-3xl border-2 border-border bg-card px-4 py-4 sm:px-5 sm:py-5 transition-all ${
        isDragging
          ? "shadow-bento translate-y-1 z-50 bg-accent"
          : "hover:-translate-y-1 hover:shadow-bento-sm"
      } ${isCompleted ? "opacity-60 grayscale-[0.3]" : ""}`}
    >
      <div className="flex items-start gap-4">
        {!isCompleted && (
          <div
            {...attributes}
            {...listeners}
            className="mt-1 hidden sm:flex cursor-grab touch-none text-muted-foreground/40 hover:text-foreground transition-colors"
            aria-label="Drag task"
            title="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            isCompleted && onRestore
              ? onRestore(task._id)
              : onComplete?.(task._id);
          }}
          className={`mt-0.5 h-7 w-7 shrink-0 rounded-[0.6rem] border-2 flex items-center justify-center transition-all shadow-sm ${
            isCompleted
              ? "bg-mint border-border text-foreground shadow-inner"
              : "border-border bg-background hover:bg-mint hover:-translate-y-0.5"
          }`}
          aria-label={isCompleted ? "Mark as active" : "Mark as completed"}
        >
          {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>

        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => !isCompleted && onEdit(task)}
        >
          <div className="flex items-center gap-2.5 min-w-0 mb-1">
            <span
              className={`h-3 w-3 rounded-full shrink-0 border-2 border-border shadow-sm ${priorityStyle.dot}`}
              aria-hidden="true"
            />
            <h4
              className={`truncate text-base sm:text-lg font-bold leading-tight ${
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
              className={`line-clamp-2 text-sm font-medium ${
                isCompleted ? "text-muted-foreground/70" : "text-muted-foreground"
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            {task.dueTime && (
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-background px-3 py-1 text-foreground shadow-sm">
                <Clock className="h-3.5 w-3.5 opacity-70" />
                {task.dueTime}
              </span>
            )}

            {!isCompleted && (
              <span
                className={`inline-flex items-center rounded-full border-2 px-3 py-1 shadow-sm ${priorityStyle.badge}`}
              >
                {priorityStyle.label}
              </span>
            )}

            {hasTags && (
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-muted px-3 py-1 text-muted-foreground shadow-sm">
                <Tag className="h-3.5 w-3.5 opacity-70" />
                {task.tags[0]}
                {task.tags.length > 1 ? ` +${task.tags.length - 1}` : ""}
              </span>
            )}

            {task.linkedDeck && typeof task.linkedDeck === "object" && (
              <a
                href={`/decks/${(task.linkedDeck as { _id: string; title: string })._id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-sky/30 px-3 py-1 text-foreground shadow-sm hover:bg-sky/50 transition-colors"
              >
                <Library className="h-3.5 w-3.5 opacity-70" />
                {(task.linkedDeck as { _id: string; title: string }).title}
              </a>
            )}

            {task.linkedNote && typeof task.linkedNote === "object" && (
              <a
                href={`/notes/${(task.linkedNote as { _id: string; title: string })._id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-tangerine/30 px-3 py-1 text-foreground shadow-sm hover:bg-tangerine/50 transition-colors"
              >
                <FileText className="h-3.5 w-3.5 opacity-70" />
                {(task.linkedNote as { _id: string; title: string }).title}
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task._id);
            }}
            className="h-9 w-9 rounded-full flex items-center justify-center border-2 border-transparent text-muted-foreground hover:text-red-600 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Delete task"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}