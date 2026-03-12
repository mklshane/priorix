"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import type { Task, TaskPriority } from "@/types/task";

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

  const handleSubmit = () => {
    if (!form.taskTitle.trim() || !session?.user?.id) return;
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
    if (isEditing && editingTask)
      updateTask.mutate({ taskId: editingTask._id, data });
    else createTask.mutate(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Radical custom styling for Dialog Content overriding Shadcn defaults */}
      <DialogContent className="sm:max-w-2xl bg-[#F6F4F0] dark:bg-[#111111] border-4 border-black dark:border-white p-0 rounded-none shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_#D64045] font-sans-utility gap-0">
        <div className="bg-black dark:bg-white text-white dark:text-black p-6">
          <DialogTitle className="font-editorial italic text-4xl font-normal">
            {isEditing ? "Revise Directive" : "Draft New Directive"}
          </DialogTitle>
        </div>

        <div className="p-8 space-y-8 text-black dark:text-white">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold">
              Primary Objective *
            </label>
            <input
              className="w-full bg-transparent border-b-2 border-black dark:border-white py-3 text-2xl font-editorial focus:outline-none focus:border-[#D64045] transition-colors rounded-none placeholder:text-black/20 dark:placeholder:text-white/20"
              placeholder="State the objective..."
              value={form.taskTitle}
              onChange={(e) => setForm({ ...form, taskTitle: e.target.value })}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold">
              Parameters (Optional)
            </label>
            <textarea
              className="w-full bg-transparent border-2 border-black/20 dark:border-white/20 p-4 min-h-[100px] text-sm focus:outline-none focus:border-black dark:focus:border-white rounded-none resize-none"
              placeholder="Additional context or requirements..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold">
                Execution Date
              </label>
              <input
                type="date"
                className="w-full bg-transparent border-b-2 border-black dark:border-white py-2 uppercase focus:outline-none rounded-none"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold">
                Execution Time
              </label>
              <input
                type="time"
                className="w-full bg-transparent border-b-2 border-black dark:border-white py-2 uppercase focus:outline-none rounded-none"
                value={form.dueTime}
                onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2 flex flex-col">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold">
                Classification (Priority)
              </label>
              <select
                className="bg-transparent border-2 border-black dark:border-white p-3 uppercase text-sm font-bold focus:outline-none cursor-pointer rounded-none appearance-none"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as TaskPriority })
                }
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold">
                Tags (CSV)
              </label>
              <input
                className="w-full bg-transparent border-b-2 border-black dark:border-white py-2 focus:outline-none rounded-none"
                placeholder="logistics, client, etc."
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t-2 border-black dark:border-white flex justify-end gap-4 bg-black/[0.02] dark:bg-white/[0.02]">
          <button
            className="px-6 py-3 border border-black dark:border-white text-sm uppercase tracking-widest font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            onClick={() => onOpenChange(false)}
          >
            Abort
          </button>
          <button
            disabled={!form.taskTitle.trim()}
            className="px-8 py-3 bg-[#D64045] text-white text-sm uppercase tracking-widest font-bold disabled:opacity-50 hover:bg-black dark:hover:bg-white dark:hover:text-black transition-colors border-2 border-transparent hover:border-black dark:hover:border-white"
            onClick={handleSubmit}
          >
            {isEditing ? "Commit Changes" : "Initialize"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
