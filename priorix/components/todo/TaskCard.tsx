"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Tag,
  FileText,
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

const PRIORITY_STYLES: Record<string, { border: string; badge: string; label: string }> = {
  urgent: {
    border: "border-l-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    label: "Urgent",
  },
  high: {
    border: "border-l-orange-400",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    label: "High",
  },
  medium: {
    border: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Medium",
  },
  low: {
    border: "border-l-gray-400",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        group flex items-start gap-2 p-3 rounded-lg border-l-3 bg-card
        transition-shadow
        ${isDragging ? "opacity-50 shadow-lg z-50" : "hover:shadow-sm"}
        ${isCompleted ? "border-l-gray-300 dark:border-l-gray-600 opacity-70" : priorityStyle.border}
        ${task.color ? "" : ""}
      `}
    >
      {/* Drag handle */}
      {!isCompleted && (
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Checkbox */}
      <button
        onClick={() => {
          if (isCompleted && onRestore) onRestore(task._id);
          else if (!isCompleted && onComplete) onComplete(task._id);
        }}
        className={`
          flex h-5 w-5 items-center justify-center rounded border mt-0.5
          transition-all duration-200 flex-shrink-0
          ${
            isCompleted
              ? "bg-primary border-primary"
              : "border-muted-foreground/30 hover:border-primary/50"
          }
        `}
      >
        {isCompleted && (
          <svg
            className="h-3 w-3 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
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
              className={`text-sm font-medium ${
                isCompleted
                  ? "line-through text-muted-foreground"
                  : "text-card-foreground"
              }`}
            >
              {task.taskTitle}
            </div>

            {task.description && (
              <p
                className={`text-xs mt-1 line-clamp-2 ${
                  isCompleted ? "text-muted-foreground/60" : "text-muted-foreground"
                }`}
              >
                {task.description}
              </p>
            )}
          </div>

          {/* Priority badge */}
          {!isCompleted && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${priorityStyle.badge}`}
            >
              {priorityStyle.label}
            </span>
          )}
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {task.dueTime && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.dueTime}
            </span>
          )}

          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}

          {isCompleted && task.completedAt && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
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
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          {!isCompleted && (
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          {isCompleted && onRestore && (
            <DropdownMenuItem onClick={() => onRestore(task._id)}>
              <Undo2 className="h-4 w-4 mr-2" />
              Restore
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => onDelete(task._id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
