import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Tag,
  FileText,
  MoreVertical,
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

interface Task {
  _id: string;
  taskTitle: string;
  description?: string;
  status: "todo" | "in-progress" | "completed";
  dueDate?: string;
  tags: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TodoList() {
  const { data: session, status: sessionStatus } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const { showToast } = useToast();

  // New task form state
  const [newTask, setNewTask] = useState({
    taskTitle: "",
    description: "",
    dueDate: "",
    tags: "",
  });

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchTasks();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
      setTasks([]);
    }
  }, [sessionStatus]);

  const fetchTasks = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/tasks?status=todo&userId=${session.user.id}`
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("API Error details:", errorData);
        } catch (e) {
          console.error("Could not parse error response:", e);
        }

        if (response.status === 401) {
          showToast("Please sign in to view tasks", "error");
        } else if (response.status === 400) {
          showToast("Invalid request. Please try again.", "error");
        } else {
          showToast(`Failed to load tasks: ${errorMessage}`, "error");
        }
        return;
      }

      const tasksData = await response.json();

      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      showToast("Failed to load tasks. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (): Promise<void> => {
    if (newTask.taskTitle.trim() === "") {
      showToast("Task title is required", "error");
      return;
    }

    if (!session?.user?.id) {
      showToast("Please sign in to create tasks", "error");
      return;
    }

    try {
      const tagsArray = newTask.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      console.log("Creating task with data:", {
        taskTitle: newTask.taskTitle.trim(),
        description: newTask.description.trim(),
        dueDate: newTask.dueDate,
        tags: tagsArray,
        userId: session.user.id,
      });

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

      console.log("Create task response status:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("API Error details:", errorData);
        } catch (e) {
          console.error("Could not parse error response:", e);
        }

        if (response.status === 401) {
          showToast("Please sign in to create tasks", "error");
        } else if (response.status === 400) {
          showToast("Invalid task data. Please check your input.", "error");
        } else {
          showToast(`Failed to create task: ${errorMessage}`, "error");
        }
        return;
      }

      const createdTask = await response.json();
      console.log("Task created successfully:", createdTask);

      setTasks([createdTask, ...tasks]);

      setNewTask({
        taskTitle: "",
        description: "",
        dueDate: "",
        tags: "",
      });
      setIsAddDialogOpen(false);

      showToast("Task added successfully", "success");
    } catch (error) {
      console.error("Error adding task:", error);
      showToast("Failed to add task. Please try again.", "error");
    }
  };

  const updateTaskStatus = async (
    taskId: string,
    currentStatus: string
  ): Promise<void> => {
    if (!session?.user?.id) {
      showToast("Please sign in to update tasks", "error");
      return;
    }

    try {
      setCompletingTaskId(taskId);

      const newStatus = currentStatus === "completed" ? "todo" : "completed";

      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("Could not parse error response:", e);
        }

        if (response.status === 401) {
          showToast("Please sign in to update tasks", "error");
        } else {
          showToast(`Failed to update task: ${errorMessage}`, "error");
        }
        setCompletingTaskId(null); // Reset visual feedback on error
        return;
      }

      const updatedTask = await response.json();

      if (newStatus === "completed") {
        // Add a small delay to show the checkmark before removing
        setTimeout(() => {
          setTasks(tasks.filter((task) => task._id !== taskId));
          setCompletingTaskId(null);
        }, 300);
      } else {
        setTasks(
          tasks.map((task) => (task._id === taskId ? updatedTask : task))
        );
        setCompletingTaskId(null);
      }

      showToast(`Task marked as ${newStatus}`, "success");
    } catch (error) {
      console.error("Error updating task:", error);
      showToast("Failed to update task", "error");
      setCompletingTaskId(null); // Reset visual feedback on error
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    if (!session?.user?.id) {
      showToast("Please sign in to delete tasks", "error");
      return;
    }

    try {
      const response = await fetch(
        `/api/tasks/${taskId}?userId=${session.user.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("Could not parse error response:", e);
        }

        if (response.status === 401) {
          showToast("Please sign in to delete tasks", "error");
        } else {
          showToast(`Failed to delete task: ${errorMessage}`, "error");
        }
        return;
      }

      setTasks(tasks.filter((task) => task._id !== taskId));
      showToast("Task deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting task:", error);
      showToast("Failed to delete task", "error");
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <Card className="bg-card border-2 border-black py-7 h-full flex flex-col gap-0  dark:border-darkborder">
        <CardHeader className="pb-3">
          <CardTitle className="text-card-foreground text-lg flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Todo List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-md">
                <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-2 border-black py-7 h-full flex flex-col gap-0 dark:border-darkborder">
      <CardHeader className="pb-3">
        <CardTitle className="text-card-foreground text-lg flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Todo List
          {tasks.length > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              ({tasks.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Add Task Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mb-4" disabled={!session}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Task
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="taskTitle">Task Title *</Label>
                <Input
                  id="taskTitle"
                  placeholder="Enter task title..."
                  value={newTask.taskTitle}
                  onChange={(e) =>
                    setNewTask({ ...newTask, taskTitle: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description..."
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">
                  Tags{" "}
                  <span className="text-muted-foreground text-sm">
                    (comma-separated)
                  </span>
                </Label>
                <Input
                  id="tags"
                  placeholder="work, personal, urgent..."
                  value={newTask.tags}
                  onChange={(e) =>
                    setNewTask({ ...newTask, tags: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={addTask}
                disabled={newTask.taskTitle.trim() === ""}
              >
                Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {!session ? (
          <div className="text-center text-muted-foreground py-8">
            Please sign in to manage tasks
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No tasks yet. Click "Add New Task" to get started!
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 border-1 border-primary group"
                >
                  <button
                    onClick={() => updateTaskStatus(task._id, task.status)}
                    className={`flex h-5 w-5 items-center justify-center rounded border mt-0.5 transition-all duration-200 ${
                      completingTaskId === task._id ||
                      task.status === "completed"
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30 hover:border-primary/50"
                    }`}
                    disabled={completingTaskId === task._id}
                  >
                    {(completingTaskId === task._id ||
                      task.status === "completed") && (
                      <svg
                        className="h-3 w-3 text-white"
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

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div
                        className={`text-sm ${
                          task.status === "completed"
                            ? "text-muted-foreground line-through"
                            : "text-card-foreground"
                        }`}
                      >
                        {task.taskTitle}
                      </div>

                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground sm:ml-2 sm:mt-0.5 whitespace-nowrap">
                          <Calendar className="h-3 w-3" />
                          Due {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>

                    {task.description && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                        <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="break-words">{task.description}</span>
                      </div>
                    )}

                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1"
                          >
                            <Tag className="h-3 w-3" />
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
                        className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => deleteTask(task._id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
