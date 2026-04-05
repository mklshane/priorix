"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, X, Check, Clock, Tag, Library, FileText } from "lucide-react";
import type { Task } from "@/types/task";

const PRIORITY_STYLES: Record<
  string,
  { dot: string; label: string }
> = {
  urgent: { dot: "bg-red-500", label: "Urgent" },
  high: { dot: "bg-orange-500", label: "High" },
  medium: { dot: "bg-sky-500", label: "Medium" },
  low: { dot: "bg-zinc-400", label: "Low" },
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
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const hasDescription = Boolean(task.description?.trim());
  const hasTags = Array.isArray(task.tags) && task.tags.length > 0;
  const hasLinks = task.linkedDeck || task.linkedNote;

  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`group relative rounded-2xl border-2 border-border bg-card px-3 py-2.5 sm:px-4 sm:py-3 transition-all ${
        isDragging
          ? "shadow-bento translate-y-1 z-50 bg-accent"
          : "hover:-translate-y-0.5 hover:shadow-bento-sm"
      } ${isCompleted ? "opacity-60 grayscale-[0.3]" : ""}`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Drag Handle (Desktop only) */}
        {!isCompleted && (
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 hidden sm:flex cursor-grab touch-none text-muted-foreground/30 hover:text-foreground transition-colors shrink-0"
            aria-label="Drag task"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            isCompleted && onRestore ? onRestore(task._id) : onComplete?.(task._id);
          }}
          className={`mt-0.5 h-5 w-5 sm:h-6 sm:w-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? "bg-mint border-border text-foreground shadow-inner"
              : "border-border bg-background hover:bg-mint"
          }`}
        >
          {isCompleted && <Check className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={3} />}
        </button>

        {/* Main Content */}
        <div
          className="min-w-0 flex-1 cursor-pointer flex flex-col justify-center"
          onClick={() => !isCompleted && onEdit(task)}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-1 md:gap-4">
            
            {/* Left Column: Title & Desc & Mobile Meta */}
            <div className="min-w-0 flex-1">
              <h4
                className={`truncate text-sm sm:text-[18px] font-bold leading-tight ${
                  isCompleted ? "text-muted-foreground line-through decoration-2" : "text-foreground"
                }`}
              >
                {task.taskTitle}
              </h4>
              
              {hasDescription && (
                <p className={`truncate text-xs font-medium mt-0.5 ${
                  isCompleted ? "text-muted-foreground/50" : "text-muted-foreground/80"
                }`}>
                  {task.description}
                </p>
              )}

              {/* Mobile Meta Data: Always visible, wraps naturally */}
              <div className="flex md:hidden flex-wrap items-center gap-3 mt-1.5 text-[10px] font-semibold text-muted-foreground/80">
                {!isCompleted && (
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${priorityStyle.dot}`} />
                    {priorityStyle.label}
                  </span>
                )}
                {task.dueTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.dueTime}
                  </span>
                )}
                {hasTags && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {task.tags[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Right Column (Desktop): Meta Data (Larger, separated by |) */}
            <div className="hidden md:flex items-center gap-2.5 shrink-0 text-sm font-medium text-muted-foreground/80 pt-0.5">
              {task.dueTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {task.dueTime}
                </span>
              )}

              {/* First Pipe: Between Time and (Priority OR Tags) */}
              {task.dueTime && (!isCompleted || hasTags) && (
                <span className="text-muted-foreground/30 font-light">|</span>
              )}

              {!isCompleted && (
                <span className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${priorityStyle.dot}`} />
                  {priorityStyle.label}
                </span>
              )}

              {/* Second Pipe: Between Priority and Tags */}
              {!isCompleted && hasTags && (
                <span className="text-muted-foreground/30 font-light">|</span>
              )}

              {hasTags && (
                <span className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4" />
                  {task.tags[0]}
                  {task.tags.length > 1 && ` +${task.tags.length - 1}`}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Row: Action Chips (Scrolls inline) */}
          {hasLinks && (
            <div className="mt-2 flex items-center flex-nowrap overflow-x-auto gap-2 pb-1 pt-0.5 px-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {task.linkedDeck && typeof task.linkedDeck === "object" && (
                <a
                  href={`/decks/${(task.linkedDeck as { _id: string; title: string })._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-primary bg-sky/50 px-2.5 py-1 text-[10px] sm:text-sm font-bold uppercase tracking-wider text-foreground shadow-sm hover:bg-sky/30 hover:shadow hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <Library className="h-3.5 w-3.5 opacity-80" />
                  <span className="truncate max-w-[100px] sm:max-w-[150px]">
                    {(task.linkedDeck as { _id: string; title: string }).title}
                  </span>
                </a>
              )}

              {task.linkedNote && typeof task.linkedNote === "object" && (
                <a
                  href={`/notes/${(task.linkedNote as { _id: string; title: string })._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-primary bg-tangerine/50 px-2.5 py-1 text-[10px] sm:text-sm font-bold uppercase tracking-wider text-foreground shadow-sm hover:bg-tangerine/30 hover:shadow hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 opacity-80" />
                  <span className="truncate max-w-[100px] sm:max-w-[150px]">
                    {(task.linkedNote as { _id: string; title: string }).title}
                  </span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Delete Button */}
        <div className="flex items-center shrink-0 ml-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task._id);
            }}
            className="mt-0.5 h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all opacity-100 "
            aria-label="Delete task"
          >
            <X className="h-4 w-4 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}