"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, X, Check, Clock } from "lucide-react";
import type { Task } from "@/types/task";

const PRIORITY_STYLES: Record<string, { color: string; label: string }> = {
  urgent: { color: "bg-red-500", label: "URGENT" },
  high: { color: "bg-orange-400", label: "HIGH" },
  medium: { color: "bg-blue-400", label: "MED" },
  low: { color: "bg-zinc-400", label: "LOW" },
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`
        group relative flex items-center gap-3 py-2 px-3 sm:px-4 rounded-xl border border-border bg-card shadow-sm
        
        
      `}
    >
      {/* Priority Indicator Line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl `} />

      {/* Drag handle */}
      {!isCompleted && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground touch-none shrink-0 p-1 -ml-1"
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
        className={`
          w-5 h-5 flex items-center justify-center rounded-full border-[1.5px] transition-all shrink-0 ml-1 hover:border-mint dark:hover:border-mint
          ${isCompleted ? "bg-mint border-mint text-white" : "border-border bg-transparent text-transparent hover:bg-mint/10"}
        `}
      >
        {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>

      <div 
        className="flex-1 min-w-0 pr-2 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
        onClick={() => !isCompleted && onEdit(task)}
      >
        <div className="flex items-center gap-2 min-w-0">
            <h4
              className={`
              font-medium text-sm sm:text-base leading-tight truncate
              
              `}
            >
              {task.taskTitle}
            </h4>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto shrink-0">
            {task.dueTime && (
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-md">
                    <Clock className="w-3 h-3" />
                    {task.dueTime}
                </div>
            )}
            
            {!isCompleted && (
                <span className={`text-[9px] sm:text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-md text-white `}>
                    {priorityStyle.label}
                </span>
            )}
        </div>
      </div>

      <div className="flex items-center shrink-0">
        <button
          onClick={(e) => {
             e.stopPropagation();
             onDelete(task._id);
          }}
          className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
