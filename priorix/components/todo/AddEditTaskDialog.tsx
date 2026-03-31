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
import { useAllDecks } from "@/hooks/useDeck";
import { useNotes } from "@/hooks/useNotes";
import type { Task, TaskPriority, LinkedEntity } from "@/types/task";
import { CheckSquare, Clock, Tag, Flag, Library, FileText } from "lucide-react";

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
  const { data: allDecks = [] } = useAllDecks();
  const { data: allNotes = [] } = useNotes(true, {});

  const isEditing = !!editingTask;
  const [form, setForm] = useState({
    taskTitle: "",
    description: "",
    dueDate: format(selectedDate, "yyyy-MM-dd"),
    dueTime: "",
    priority: "medium" as TaskPriority,
    tags: "",
    linkedDeck: null as LinkedEntity | null,
    linkedNote: null as LinkedEntity | null,
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
        linkedDeck:
          editingTask.linkedDeck && typeof editingTask.linkedDeck === "object"
            ? (editingTask.linkedDeck as LinkedEntity)
            : null,
        linkedNote:
          editingTask.linkedNote && typeof editingTask.linkedNote === "object"
            ? (editingTask.linkedNote as LinkedEntity)
            : null,
      });
    } else {
      setForm({
        taskTitle: "",
        description: "",
        dueDate: format(selectedDate, "yyyy-MM-dd"),
        dueTime: "",
        priority: "medium",
        tags: "",
        linkedDeck: null,
        linkedNote: null,
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
        linkedDeck: form.linkedDeck?._id ?? null,
        linkedNote: form.linkedNote?._id ?? null,
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
    "w-full h-14 rounded-2xl border-2 border-border bg-background px-4 py-2 font-medium text-base focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary disabled:opacity-60 transition-colors shadow-inner";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-2 border-border shadow-bento !rounded-[2rem] bg-card max-h-[95dvh] flex flex-col">
        <DialogHeader className="flex flex-col items-center justify-center gap-2 border-b-2 border-border bg-muted/30 px-6 py-6 shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-primary shadow-sm">
            <CheckSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="space-y-1 text-center">
            <DialogTitle className="font-editorial text-3xl text-foreground">
              {isEditing ? "Edit Task" : "New Task"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
              {isEditing ? "Update existing details" : "Add to your agenda"}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 font-sans">
          
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Task Name *</Label>
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
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Description (Optional)</Label>
            <Textarea
              className={`${fieldStyles} min-h-[100px] resize-none py-3`}
              placeholder="Add details, links, or notes..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                <Clock className="w-3.5 h-3.5"/> Date
              </Label>
              <Input
                type="date"
                className={fieldStyles + " block"}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                <Clock className="w-3.5 h-3.5"/> Time
              </Label>
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
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                <Flag className="w-3.5 h-3.5"/> Priority
              </Label>
              <div className="relative">
                <select
                  className={fieldStyles + " appearance-none cursor-pointer pr-10"}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
                  ▼
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                <Tag className="w-3.5 h-3.5"/> Tags (CSV)
              </Label>
              <Input
                className={fieldStyles}
                placeholder="work, personal..."
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                <Library className="w-3.5 h-3.5" /> Link Deck
              </Label>
              <div className="relative">
                <select
                  className={fieldStyles + " appearance-none cursor-pointer pr-10"}
                  value={form.linkedDeck?._id ?? ""}
                  onChange={(e) => {
                    const deck = allDecks.find((d) => d._id === e.target.value);
                    setForm({
                      ...form,
                      linkedDeck: deck ? { _id: deck._id, title: deck.title } : null,
                    });
                  }}
                >
                  <option value="">— None —</option>
                  {allDecks.map((deck) => (
                    <option key={deck._id} value={deck._id}>
                      {deck.title}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
                  ▼
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                <FileText className="w-3.5 h-3.5" /> Link Note
              </Label>
              <div className="relative">
                <select
                  className={fieldStyles + " appearance-none cursor-pointer pr-10"}
                  value={form.linkedNote?._id ?? ""}
                  onChange={(e) => {
                    const note = allNotes.find((n) => n._id === e.target.value);
                    setForm({
                      ...form,
                      linkedNote: note ? { _id: note._id, title: note.title } : null,
                    });
                  }}
                >
                  <option value="">— None —</option>
                  {allNotes.map((note) => (
                    <option key={note._id} value={note._id}>
                      {note.title}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
                  ▼
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <div className="flex w-full items-center justify-end gap-3 border-t-2 border-transparent">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="h-12 px-6 rounded-full font-bold border-2 border-border hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.taskTitle.trim()}
                className="h-12 px-8 rounded-full border-2 border-border bg-primary text-primary-foreground font-bold hover:bg-primary/90 hover:-translate-y-0.5 shadow-sm transition-all"
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