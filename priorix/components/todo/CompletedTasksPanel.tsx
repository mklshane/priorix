"use client";

import { useState } from "react";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import TaskCard from "./TaskCard";
import type { Task } from "@/types/task";

interface CompletedTasksPanelProps {
  tasks: Task[];
  onRestore: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

function groupByCompletionDate(tasks: Task[]) {
  const groups: { label: string; tasks: Task[] }[] = [
    { label: "Today", tasks: [] },
    { label: "Yesterday", tasks: [] },
    { label: "This Week", tasks: [] },
    { label: "Older", tasks: [] },
  ];

  const sorted = [...tasks].sort(
    (a, b) =>
      new Date(b.completedAt || b.updatedAt).getTime() -
      new Date(a.completedAt || a.updatedAt).getTime()
  );

  sorted.forEach((task) => {
    const date = new Date(task.completedAt || task.updatedAt);
    if (isToday(date)) groups[0].tasks.push(task);
    else if (isYesterday(date)) groups[1].tasks.push(task);
    else if (isThisWeek(date)) groups[2].tasks.push(task);
    else groups[3].tasks.push(task);
  });

  return groups.filter((g) => g.tasks.length > 0);
}

export default function CompletedTasksPanel({
  tasks,
  onRestore,
  onDelete,
  onEdit,
}: CompletedTasksPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (tasks.length === 0) return null;

  const groups = groupByCompletionDate(tasks);
  const previewTasks = tasks
    .sort(
      (a, b) =>
        new Date(b.completedAt || b.updatedAt).getTime() -
        new Date(a.completedAt || a.updatedAt).getTime()
    )
    .slice(0, 3);

  return (
    <div className="mt-5 pt-4 border-t border-border/60">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full group/completed"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted/60 group-hover/completed:bg-muted transition-colors">
          <History className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-medium">
          Completed ({tasks.length})
        </span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 ml-auto" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 ml-auto" />
        )}
      </button>

      {!isExpanded && previewTasks.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {previewTasks.map((task) => (
            <div
              key={task._id}
              className="text-xs text-muted-foreground/60 line-through pl-8 truncate"
            >
              {task.taskTitle}
            </div>
          ))}
          {tasks.length > 3 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-primary/70 hover:text-primary hover:underline pl-8 transition-colors"
            >
              +{tasks.length - 3} more
            </button>
          )}
        </div>
      )}

      {isExpanded && (
        <div className="mt-3 space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="text-[11px] font-medium text-muted-foreground/70 mb-2 pl-1 uppercase tracking-wider">
                {group.label}
              </div>
              <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      variant="completed"
                      onRestore={onRestore}
                      onDelete={onDelete}
                      onEdit={onEdit}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
