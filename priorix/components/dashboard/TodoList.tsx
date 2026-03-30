"use client";

import {
  CheckSquare,
  Plus,
  Trash2,
  MoreVertical,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface Task {
  _id: string;
  taskTitle: string;
  description?: string;
  status: "todo" | "in-progress" | "completed";
  dueDate?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  tags: string[];
}

export default function TodoList() {
  const { data: session, status: sessionStatus } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [newTask, setNewTask] = useState({
    taskTitle: "",
    description: "",
    dueDate: "",
    tags: "",
  });

  useEffect(() => {
    if (sessionStatus === "authenticated") fetchTasks();
    else if (sessionStatus === "unauthenticated") {
      setLoading(false);
      setTasks([]);
    }
  }, [sessionStatus]);

  const fetchTasks = async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const response = await fetch(
        `/api/tasks?status=todo&userId=${session.user.id}`,
      );
      if (!response.ok) throw new Error("Failed");
      setTasks(await response.json());
    } catch {
      showToast("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.taskTitle.trim() || !session?.user?.id) return;
    try {
      const tagsArray = newTask.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: newTask.taskTitle.trim(),
          description: newTask.description.trim() || undefined,
          dueDate: newTask.dueDate || undefined,
          tags: tagsArray,
          userId: session.user.id,
        }),
      });
      if (!response.ok) throw new Error("Failed");
      setTasks([await response.json(), ...tasks]);
      setNewTask({ taskTitle: "", description: "", dueDate: "", tags: "" });
      setIsAddDialogOpen(false);
      showToast("Task added successfully", "success");
    } catch {
      showToast("Failed to add task", "error");
    }
  };

  const updateTaskStatus = async (taskId: string, currentStatus: string) => {
    if (!session?.user?.id) return;
    try {
      setCompletingTaskId(taskId);
      const newStatus = currentStatus === "completed" ? "todo" : "completed";
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, userId: session.user.id }),
      });
      if (!response.ok) throw new Error("Failed");
      const updatedTask = await response.json();

      if (newStatus === "completed") {
        setTimeout(() => {
          setTasks(tasks.filter((t) => t._id !== taskId));
          setCompletingTaskId(null);
        }, 300);
      } else {
        setTasks(tasks.map((t) => (t._id === taskId ? updatedTask : t)));
        setCompletingTaskId(null);
      }
    } catch {
      showToast("Failed to update task", "error");
      setCompletingTaskId(null);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch(
        `/api/tasks/${taskId}?userId=${session.user.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed");
      setTasks(tasks.filter((t) => t._id !== taskId));
      showToast("Task deleted", "success");
    } catch {
      showToast("Failed to delete task", "error");
    }
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  const formatDate = (dateString?: string) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "";

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="bento-card bg-card h-full min-h-[400px] animate-pulse" />
    );
  }

  return (
    <div className="bento-card bg-card h-full flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {tasks.length > 0 ? `${tasks.length} pending` : "Tasks"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/todo"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            All <ArrowRight className="h-3 w-3" />
          </Link>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-40"
                disabled={!session}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-4 border-border rounded-3xl shadow-bento-lg">
              <DialogHeader>
                <DialogTitle className="font-editorial text-3xl italic">
                  New Task
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 font-sans">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">
                    Title *
                  </Label>
                  <Input
                    value={newTask.taskTitle}
                    onChange={(e) =>
                      setNewTask({ ...newTask, taskTitle: e.target.value })
                    }
                    placeholder="What needs to be done?"
                    className="border-2 border-border rounded-xl"
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">
                    Notes
                  </Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    placeholder="Optional details..."
                    className="border-2 border-border rounded-xl resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">
                      Due Date
                    </Label>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                      className="border-2 border-border rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">
                      Tags
                    </Label>
                    <Input
                      placeholder="comma-separated"
                      value={newTask.tags}
                      onChange={(e) =>
                        setNewTask({ ...newTask, tags: e.target.value })
                      }
                      className="border-2 border-border rounded-xl"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="border-2 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addTask}
                  disabled={!newTask.taskTitle.trim()}
                  className="btn-primary rounded-xl"
                >
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/40 border-2 border-dashed border-border flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/60">All clear</p>
              <p className="text-xs text-muted-foreground mt-0.5">No pending tasks.</p>
            </div>
            <button
              onClick={() => setIsAddDialogOpen(true)}
              disabled={!session}
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
          </div>
        ) : (
          tasks.map((task) => {
            const overdue = isOverdue(task.dueDate);
            const isCompleting = completingTaskId === task._id;
            const isDone = task.status === "completed" || isCompleting;

            return (
              <div
                key={task._id}
                className={`group flex items-start gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 ${
                  isDone
                    ? "opacity-50 border-border/10 bg-background/30"
                    : overdue
                    ? "border-blush/50 bg-blush/5 hover:border-blush hover:shadow-bento-sm"
                    : "border-border/10 bg-background/50 hover:border-border hover:shadow-bento-sm"
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => updateTaskStatus(task._id, task.status)}
                  disabled={isCompleting}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                    isDone
                      ? "border-mint bg-mint"
                      : overdue
                      ? "border-blush bg-background hover:border-blush/80 hover:bg-blush/10"
                      : "border-border bg-background hover:border-mint hover:bg-mint/10"
                  }`}
                >
                  {isDone && (
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-foreground" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 justify-between">
                    <p
                      className={`text-sm font-semibold leading-snug ${
                        isDone ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {task.taskTitle}
                    </p>
                    {task.dueDate && (
                      <span
                        className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                          overdue
                            ? "bg-blush text-foreground border-blush/50"
                            : "bg-muted text-muted-foreground border-border/20"
                        }`}
                      >
                        {overdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-mint/20 border border-mint/40 text-foreground text-[8px] font-bold uppercase tracking-widest rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded-full hover:bg-muted mt-0.5"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-2 border-border rounded-xl shadow-bento-sm"
                  >
                    <DropdownMenuItem
                      onClick={() => deleteTask(task._id)}
                      className="text-destructive font-bold text-xs uppercase tracking-widest focus:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
