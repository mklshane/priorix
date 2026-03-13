"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import type { Task, TaskPriority } from "@/types/task";
import { CheckSquare, Clock, Tag, Flag } from "lucide-react";

export default function AddEditTaskDialog({
  open,
  onOpenChange,
  selectedDate,
  editingTask,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  editingTask?: Task | null;
}) {
  const { data: session } = useSession();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const isEditing = !!editingTask;
  const [form, setForm] = useState({
    taskTitle: "",
    description: "",
    dueDate: format(selectedDate, "yyyy-MM-dd"),
    dueTime: "",
    priority: "medium" as TaskPriority,
    tags: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setForm({
        taskTitle: editingTask.taskTitle,
        description: editingTask.description || "",
        dueDate: editingTask.dueDate
          ? format(new Date(editingTask.dueDate), "yyyy-MM-dd")
          : format(selectedDate, "yyyy-MM-dd"),
        dueTime: editingTask.dueTime || "",
        priority: editingTask.priority || "medium",
        tags: editingTask.tags.join(", "),
      });
    } else {
      setForm({
        taskTitle: "",
        description: "",
        dueDate: format(selectedDate, "yyyy-MM-dd"),
        dueTime: "",
        priority: "medium",
        tags: "",
      });
    }
  }, [editingTask, selectedDate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.taskTitle.trim() || !session?.user?.id) return;
    setIsLoading(true);
    
    try {
      const data = {
        taskTitle: form.taskTitle.trim(),
        description: form.description.trim() || undefined,
        dueDate: form.dueDate || undefined,
        dueTime: form.dueTime || undefined,
        priority: form.priority,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        userId: session.user.id,
      };
      
      if (isEditing && editingTask) {
        await updateTask.mutateAsync({ taskId: editingTask._id, data });
      } else {
        await createTask.mutateAsync(data);
      }
      onOpenChange(false);
    } catch(err) {
       console.error("Error saving task", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fieldStyles =
    "w-full min-h-[48px] rounded-xl border-2 border-border bg-background px-4 py-2 font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:border-foreground disabled:opacity-60 transition-colors";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-2 border-border shadow-bento !rounded-[2rem] bg-card max-h-[95dvh] flex flex-col">
        <DialogHeader className="flex flex-col items-center justify-center gap-2 border-b-2 border-border bg-mint px-6 py-6 shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border bg-white shadow-bento-sm">
            <CheckSquare className="h-6 w-6 text-foreground" />
          </div>
          <div className="space-y-1 text-center">
            <DialogTitle className="font-editorial text-3xl text-foreground">
              {isEditing ? "Edit Task" : "New Task"}
            </DialogTitle>
            <DialogDescription className="text-foreground/70 font-medium text-xs">
              {isEditing ? "Update your existing task details." : "Add a new task to your agenda."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 font-sans">
          
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Task Name *</Label>
            <Input
              className={fieldStyles}
              placeholder="What needs to be done?"
              value={form.taskTitle}
              onChange={(e) => setForm({ ...form, taskTitle: e.target.value })}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description (Optional)</Label>
            <Textarea
              className={fieldStyles}
              placeholder="Add details, links, or notes..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> Date</Label>
              <Input
                type="date"
                className={fieldStyles + " block"}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> Time</Label>
              <Input
                type="time"
                className={fieldStyles + " block"}
                value={form.dueTime}
                onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Flag className="w-3 h-3"/> Priority</Label>
              <select
                className={fieldStyles + " appearance-none cursor-pointer"}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3"/> Tags (comma separated)</Label>
              <Input
                className={fieldStyles}
                placeholder="work, personal..."
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <div className="flex w-full items-center justify-end gap-3 border-t-2 border-transparent">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="h-12 px-6 rounded-xl font-bold hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.taskTitle.trim()}
                className="h-12 px-8 rounded-xl border-2 border-border bg-foreground text-background font-bold hover:bg-foreground/90 hover:-translate-y-0.5 transition-transform"
              >
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
