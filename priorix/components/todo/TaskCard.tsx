"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import type { Task } from "@/types/task";

const PRIORITY_STYLES: Record<string, { color: string; label: string }> = {
  urgent: { color: "bg-[#D64045]", label: "URGENT" },
  high: { color: "bg-orange-500", label: "HIGH" },
  medium: { color: "bg-black dark:bg-white", label: "MED" },
  low: { color: "bg-black/30 dark:bg-white/30", label: "LOW" },
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

  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`
        group relative flex items-start gap-6 py-5 border-b border-black/10 dark:border-white/10
        ${isDragging ? "opacity-30 grayscale" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}
        transition-colors duration-200
      `}
    >
      {/* Node connector to the timeline */}
      <div
        className={`
        absolute left-[-36px] top-6 w-[8px] h-[8px] rotate-45 transition-all duration-300
        ${isCompleted ? "bg-transparent border border-black/30 dark:border-white/30" : priorityStyle.color}
      `}
      />

      {/* Drag handle */}
      {!isCompleted && (
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab opacity-0 group-hover:opacity-100 text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      {/* Time & Priority Column */}
      <div className="w-16 flex-shrink-0 flex flex-col gap-1 mt-1">
        <span className="font-sans-utility text-sm tracking-wider font-bold">
          {task.dueTime || "ANY"}
        </span>
        {!isCompleted && (
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-black/50 dark:text-white/50">
            {priorityStyle.label}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pr-8">
        <div
          className={`cursor-pointer ${isCompleted ? "opacity-50" : ""}`}
          onClick={() => !isCompleted && onEdit(task)}
        >
          <h4
            className={`
            font-editorial text-2xl md:text-3xl leading-tight
            ${isCompleted ? "line-through decoration-[#D64045] decoration-2 italic" : ""}
          `}
          >
            {task.taskTitle}
          </h4>
          {task.description && !isCompleted && (
            <p className="mt-2 text-sm font-sans-utility text-black/70 dark:text-white/70 max-w-2xl leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {!isCompleted && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {task.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] uppercase tracking-widest border border-black/20 dark:border-white/20 px-2 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions: Sharp Geometric Checkbox & Delete */}
      <div className="flex flex-col items-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() =>
            isCompleted && onRestore
              ? onRestore(task._id)
              : onComplete?.(task._id)
          }
          className={`
            w-8 h-8 flex items-center justify-center border-2 transition-all duration-300
            ${isCompleted ? "bg-black dark:bg-white border-black dark:border-white" : "border-black dark:border-white hover:bg-[#D64045] hover:border-[#D64045]"}
          `}
        >
          {isCompleted && (
            <svg
              className="h-4 w-4 text-white dark:text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        <button
          onClick={() => onDelete(task._id)}
          className="text-black/30 dark:text-white/30 hover:text-[#D64045] dark:hover:text-[#D64045] transition-colors p-1"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}
