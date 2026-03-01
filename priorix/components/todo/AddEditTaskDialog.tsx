"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, BookOpen, RotateCcw } from "lucide-react";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import type { Task, TaskPriority, LinkedEntity } from "@/types/task";

const TASK_COLORS = [
  { name: "None", value: "" },
  { name: "Green", value: "#cae044" },
  { name: "Violet", value: "#8e47b9" },
  { name: "Purple", value: "#c4a0ff" },
  { name: "Perry", value: "#39cbb7" },
  { name: "Pink", value: "#ffb6fb" },
  { name: "Blue", value: "#87ceeb" },
];

interface AddEditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  editingTask?: Task | null;
}

interface DeckOption {
  _id: string;
  title: string;
}

interface NoteOption {
  _id: string;
  title: string;
}

export default function AddEditTaskDialog({
  open,
  onOpenChange,
  selectedDate,
  editingTask,
}: AddEditTaskDialogProps) {
  const { data: session } = useSession();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [decks, setDecks] = useState<DeckOption[]>([]);
  const [notes, setNotes] = useState<NoteOption[]>([]);
  const [showRecurring, setShowRecurring] = useState(false);

  const isEditing = !!editingTask;

  const [form, setForm] = useState({
    taskTitle: "",
    description: "",
    dueDate: format(selectedDate, "yyyy-MM-dd"),
    dueTime: "",
    priority: "medium" as TaskPriority,
    tags: "",
    color: "",
    linkedDeck: "",
    linkedNote: "",
    recurringFrequency: "" as "" | "daily" | "weekly" | "monthly" | "custom",
    recurringInterval: "1",
    recurringEndDate: "",
  });

  // Populate form when editing
  useEffect(() => {
    if (editingTask) {
      const linkedDeck =
        editingTask.linkedDeck && typeof editingTask.linkedDeck === "object"
          ? (editingTask.linkedDeck as LinkedEntity)._id
          : (editingTask.linkedDeck as string) || "";
      const linkedNote =
        editingTask.linkedNote && typeof editingTask.linkedNote === "object"
          ? (editingTask.linkedNote as LinkedEntity)._id
          : (editingTask.linkedNote as string) || "";

      setForm({
        taskTitle: editingTask.taskTitle,
        description: editingTask.description || "",
        dueDate: editingTask.dueDate
          ? format(new Date(editingTask.dueDate), "yyyy-MM-dd")
          : format(selectedDate, "yyyy-MM-dd"),
        dueTime: editingTask.dueTime || "",
        priority: editingTask.priority || "medium",
        tags: editingTask.tags.join(", "),
        color: editingTask.color || "",
        linkedDeck,
        linkedNote,
        recurringFrequency: editingTask.recurring?.frequency || "",
        recurringInterval: String(editingTask.recurring?.interval || 1),
        recurringEndDate: editingTask.recurring?.endDate
          ? format(new Date(editingTask.recurring.endDate), "yyyy-MM-dd")
          : "",
      });
      setShowRecurring(!!editingTask.recurring);
    } else {
      setForm({
        taskTitle: "",
        description: "",
        dueDate: format(selectedDate, "yyyy-MM-dd"),
        dueTime: "",
        priority: "medium",
        tags: "",
        color: "",
        linkedDeck: "",
        linkedNote: "",
        recurringFrequency: "",
        recurringInterval: "1",
        recurringEndDate: "",
      });
      setShowRecurring(false);
    }
  }, [editingTask, selectedDate, open]);

  // Fetch decks and notes for linking
  useEffect(() => {
    if (!open || !session?.user?.id) return;

    fetch(`/api/deck?userId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        const deckList = Array.isArray(data)
          ? data
          : data.decks || data.data || [];
        setDecks(deckList.map((d: any) => ({ _id: d._id, title: d.title })));
      })
      .catch(() => setDecks([]));

    fetch(`/api/notes?userId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        const noteList = Array.isArray(data)
          ? data
          : data.notes || data.data || [];
        setNotes(noteList.map((n: any) => ({ _id: n._id, title: n.title })));
      })
      .catch(() => setNotes([]));
  }, [open, session?.user?.id]);

  const handleSubmit = async () => {
    if (!form.taskTitle.trim() || !session?.user?.id) return;

    const tagsArray = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const recurring =
      showRecurring && form.recurringFrequency
        ? {
            frequency: form.recurringFrequency as "daily" | "weekly" | "monthly" | "custom",
            interval: parseInt(form.recurringInterval) || 1,
            endDate: form.recurringEndDate || undefined,
          }
        : undefined;

    if (isEditing && editingTask) {
      updateTask.mutate({
        taskId: editingTask._id,
        data: {
          taskTitle: form.taskTitle.trim(),
          description: form.description.trim() || undefined,
          dueDate: form.dueDate || undefined,
          dueTime: form.dueTime || undefined,
          priority: form.priority,
          tags: tagsArray,
          color: form.color || undefined,
          linkedDeck: form.linkedDeck || null,
          linkedNote: form.linkedNote || null,
          recurring: recurring || null,
          userId: session.user.id,
        },
      });
    } else {
      createTask.mutate({
        taskTitle: form.taskTitle.trim(),
        description: form.description.trim() || undefined,
        dueDate: form.dueDate || undefined,
        dueTime: form.dueTime || undefined,
        priority: form.priority,
        tags: tagsArray,
        color: form.color || undefined,
        linkedDeck: form.linkedDeck || undefined,
        linkedNote: form.linkedNote || undefined,
        recurring,
        userId: session.user.id,
      });
    }

    onOpenChange(false);
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="taskTitle">Task Title *</Label>
            <Input
              id="taskTitle"
              placeholder="Enter task title..."
              value={form.taskTitle}
              onChange={(e) => setForm({ ...form, taskTitle: e.target.value })}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueTime">Due Time</Label>
              <Input
                id="dueTime"
                type="time"
                value={form.dueTime}
                onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
              />
            </div>
          </div>

          {/* Priority & Color */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm({ ...form, priority: v as TaskPriority })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex gap-1.5 items-center h-9">
                {TASK_COLORS.map((c) => (
                  <button
                    key={c.value || "none"}
                    onClick={() => setForm({ ...form, color: c.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      form.color === c.value
                        ? "border-primary scale-110"
                        : "border-border hover:scale-105"
                    }`}
                    style={
                      c.value
                        ? { backgroundColor: c.value }
                        : {
                            background:
                              "repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px",
                          }
                    }
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label htmlFor="tags">
              Tags{" "}
              <span className="text-muted-foreground text-xs">
                (comma-separated)
              </span>
            </Label>
            <Input
              id="tags"
              placeholder="work, personal, urgent..."
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          {/* Linked Deck */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Link Flashcard Deck
            </Label>
            <Select
              value={form.linkedDeck || "none"}
              onValueChange={(v) =>
                setForm({ ...form, linkedDeck: v === "none" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No deck linked" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No deck linked</SelectItem>
                {decks.map((d) => (
                  <SelectItem key={d._id} value={d._id}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Linked Note */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Link Note
            </Label>
            <Select
              value={form.linkedNote || "none"}
              onValueChange={(v) =>
                setForm({ ...form, linkedNote: v === "none" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No note linked" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No note linked</SelectItem>
                {notes.map((n) => (
                  <SelectItem key={n._id} value={n._id}>
                    {n.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurring */}
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => setShowRecurring(!showRecurring)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {showRecurring ? "Remove recurring" : "Make recurring"}
            </button>

            {showRecurring && (
              <div className="grid grid-cols-3 gap-2 pl-5">
                <Select
                  value={form.recurringFrequency}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      recurringFrequency: v as typeof form.recurringFrequency,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                {form.recurringFrequency === "custom" && (
                  <Input
                    type="number"
                    min="1"
                    placeholder="Interval"
                    value={form.recurringInterval}
                    onChange={(e) =>
                      setForm({ ...form, recurringInterval: e.target.value })
                    }
                  />
                )}

                <Input
                  type="date"
                  placeholder="End date"
                  value={form.recurringEndDate}
                  onChange={(e) =>
                    setForm({ ...form, recurringEndDate: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.taskTitle.trim() || isPending}
          >
            {isPending
              ? isEditing
                ? "Saving..."
                : "Adding..."
              : isEditing
                ? "Save Changes"
                : "Add Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
