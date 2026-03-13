"use client";

import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Tag,
  FileText,
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
    <div className="bento-card bg-card h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-border/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-citrus border-2 border-border flex items-center justify-center shadow-bento-sm">
            <CheckSquare className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-editorial italic text-foreground">
            Tasks {tasks.length > 0 && `(${tasks.length})`}
          </h2>
        </div>
        <Link
          href="/todo"
          className="text-xs font-bold uppercase tracking-widest hover:text-citrus transition-colors flex items-center gap-1"
        >
          All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="mb-6 w-full btn-base bg-background hover:bg-muted"
            disabled={!session}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Directive
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md border-4 border-border rounded-3xl shadow-bento-lg">
          <DialogHeader>
            <DialogTitle className="font-editorial text-3xl italic">
              New Directive
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 font-sans">
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest">
                Objective *
              </Label>
              <Input
                value={newTask.taskTitle}
                onChange={(e) =>
                  setNewTask({ ...newTask, taskTitle: e.target.value })
                }
                className="border-2 border-border rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest">
                Parameters
              </Label>
              <Textarea
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                className="border-2 border-border rounded-xl"
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
                  placeholder="csv..."
                  value={newTask.tags}
                  onChange={(e) =>
                    setNewTask({ ...newTask, tags: e.target.value })
                  }
                  className="border-2 border-border rounded-xl"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
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
              Commit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm font-medium italic">
            No directives pending.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="group flex items-start gap-4 p-4 rounded-2xl border-2 border-border/10 hover:border-border hover:shadow-bento-sm transition-all bg-background/50"
            >
              <button
                onClick={() => updateTaskStatus(task._id, task.status)}
                className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 mt-0.5 transition-all duration-200 shrink-0 ${completingTaskId === task._id || task.status === "completed" ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border hover:bg-muted"}`}
                disabled={completingTaskId === task._id}
              >
                {(completingTaskId === task._id ||
                  task.status === "completed") && (
                  <CheckSquare className="h-4 w-4" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div
                    className={`font-bold text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {task.taskTitle}
                  </div>
                  {task.dueDate && (
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-md">
                      Due {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>
                {task.description && (
                  <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {task.description}
                  </div>
                )}
                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {task.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-mint/30 border border-mint text-foreground text-[9px] font-bold uppercase tracking-widest rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded-full hover:bg-muted"
                  >
                    <MoreVertical className="h-4 w-4" />
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
          ))
        )}
      </div>
    </div>
  );
}
