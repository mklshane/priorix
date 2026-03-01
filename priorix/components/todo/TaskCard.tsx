"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Tag,
  MoreVertical,
  Trash2,
  Pencil,
  BookOpen,
  Layers,
  Undo2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import type { Task, LinkedEntity } from "@/types/task";
import Link from "next/link";

const PRIORITY_STYLES: Record<string, { border: string; badge: string; bg: string; label: string }> = {
  urgent: {
    border: "border-l-red-500",
    badge: "bg-red-50 text-red-600 ring-1 ring-red-200/60 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/20",
    bg: "hover:bg-red-50/40 dark:hover:bg-red-500/5",
    label: "Urgent",
  },
  high: {
    border: "border-l-orange-400",
    badge: "bg-orange-50 text-orange-600 ring-1 ring-orange-200/60 dark:bg-orange-500/15 dark:text-orange-400 dark:ring-orange-500/20",
    bg: "hover:bg-orange-50/40 dark:hover:bg-orange-500/5",
    label: "High",
  },
  medium: {
    border: "border-l-blue-500",
    badge: "bg-blue-50 text-blue-600 ring-1 ring-blue-200/60 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/20",
    bg: "hover:bg-blue-50/40 dark:hover:bg-blue-500/5",
    label: "Medium",
  },
  low: {
    border: "border-l-gray-400",
    badge: "bg-gray-50 text-gray-500 ring-1 ring-gray-200/60 dark:bg-gray-500/15 dark:text-gray-400 dark:ring-gray-500/20",
    bg: "hover:bg-gray-50/40 dark:hover:bg-gray-500/5",
    label: "Low",
  },
};

interface TaskCardProps {
  task: Task;
  variant?: "active" | "completed";
  onComplete?: (taskId: string) => void;
  onRestore?: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

export default function TaskCard({
  task,
  variant = "active",
  onComplete,
  onRestore,
  onDelete,
  onEdit,
}: TaskCardProps) {
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCompleted = variant === "completed";
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;

  const linkedDeck = task.linkedDeck && typeof task.linkedDeck === "object"
    ? (task.linkedDeck as LinkedEntity)
    : null;
  const linkedNote = task.linkedNote && typeof task.linkedNote === "object"
    ? (task.linkedNote as LinkedEntity)
    : null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`
        group flex items-start gap-2.5 p-3 rounded-xl border border-border/40 border-l-[3px] bg-card
        transition-all duration-150
        ${isDragging ? "opacity-40 shadow-lg z-50 scale-[1.02]" : `hover:shadow-sm ${priorityStyle.bg}`}
        ${isCompleted ? "border-l-gray-300 dark:border-l-gray-600 opacity-60" : priorityStyle.border}
      `}
    >
      {/* Drag handle */}
      {!isCompleted && (
        <div
          {...attributes}
          {...listeners}
          className="mt-1.5 cursor-grab opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-muted-foreground/60 transition-all duration-150"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Checkbox */}
      <button
        onClick={() => {
          if (isCompleted && onRestore) onRestore(task._id);
          else if (!isCompleted && onComplete) onComplete(task._id);
        }}
        className={`
          relative flex h-[18px] w-[18px] items-center justify-center rounded-full
          mt-[3px] flex-shrink-0 transition-all duration-200
          ${
            isCompleted
              ? "bg-primary border-2 border-primary"
              : "border-2 border-muted-foreground/25 hover:border-primary/60 hover:bg-primary/5"
          }
        `}
      >
        {isCompleted && (
          <svg
            className="h-2.5 w-2.5 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div
              className={`text-sm leading-snug ${
                isCompleted
                  ? "line-through text-muted-foreground/60"
                  : "font-medium text-card-foreground"
              }`}
            >
              {task.taskTitle}
            </div>

            {task.description && !isCompleted && (
              <p className="text-xs mt-1 line-clamp-1 text-muted-foreground/70">
                {task.description}
              </p>
            )}
          </div>

          {/* Priority badge */}
          {!isCompleted && (
            <span
              className={`text-[10px] leading-none px-2 py-1 rounded-full font-medium flex-shrink-0 ${priorityStyle.badge}`}
            >
              {priorityStyle.label}
            </span>
          )}
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2">
          {task.dueTime && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
              <Clock className="h-3 w-3" />
              {task.dueTime}
            </span>
          )}

          {task.dueDate && !isCompleted && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}

          {isCompleted && task.completedAt && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              Completed {format(new Date(task.completedAt), "MMM d, h:mm a")}
            </span>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.map((tag, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full flex items-center gap-0.5"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Linked entities */}
        {(linkedDeck || linkedNote) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {linkedDeck && (
              <Link
                href={`/decks/${linkedDeck._id}`}
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet/10 text-violet hover:bg-violet/20 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Layers className="h-2.5 w-2.5" />
                {linkedDeck.title}
              </Link>
            )}
            {linkedNote && (
              <Link
                href={`/notes/${linkedNote._id}`}
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-perry/10 text-perry hover:bg-perry/20 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <BookOpen className="h-2.5 w-2.5" />
                {linkedNote.title}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rounded-full"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          {!isCompleted && (
            <DropdownMenuItem onClick={() => onEdit(task)} className="text-xs gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
          )}
          {isCompleted && onRestore && (
            <DropdownMenuItem onClick={() => onRestore(task._id)} className="text-xs gap-2">
              <Undo2 className="h-3.5 w-3.5" />
              Restore
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => onDelete(task._id)}
            className="text-xs gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
