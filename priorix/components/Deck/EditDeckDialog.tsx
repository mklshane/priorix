"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Folder } from "@/types/deck";
import { PencilLine, FolderGit2 } from "lucide-react";

interface EditDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditSubmit: (
    title: string,
    description: string,
    isPublic: boolean,
    folderId: string | null,
    studyPeriodStart?: string,
    studyPeriodEnd?: string
  ) => void;
  initialTitle: string;
  initialDescription: string;
  initialIsPublic: boolean;
  initialFolderId?: string | null;
  initialStudyPeriodStart?: string;
  initialStudyPeriodEnd?: string;
  folders?: Folder[];
}

const EditDeckDialog: React.FC<EditDeckDialogProps> = ({
  open,
  onOpenChange,
  onEditSubmit,
  initialTitle,
  initialDescription,
  initialIsPublic,
  initialFolderId = null,
  initialStudyPeriodStart,
  initialStudyPeriodEnd,
  folders = [],
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [selectedFolderId, setSelectedFolderId] = useState<string | "" | null>(
    initialFolderId ?? ""
  );
  const [studyPeriodStart, setStudyPeriodStart] = useState(initialStudyPeriodStart ?? "");
  const [studyPeriodEnd, setStudyPeriodEnd] = useState(initialStudyPeriodEnd ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fieldStyles =
    "min-h-[48px] rounded-xl border-2 border-border bg-background px-4 py-2 font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:border-foreground disabled:opacity-60 transition-colors";

  // Update form fields when initial values change
  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setIsPublic(initialIsPublic);
    setSelectedFolderId(initialFolderId ?? "");
    setStudyPeriodStart(initialStudyPeriodStart ?? "");
    setStudyPeriodEnd(initialStudyPeriodEnd ?? "");
  }, [initialTitle, initialDescription, initialIsPublic, initialFolderId, initialStudyPeriodStart, initialStudyPeriodEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onEditSubmit(
        title.trim(),
        description.trim(),
        isPublic,
        selectedFolderId === "" || selectedFolderId === undefined
          ? null
          : selectedFolderId,
        studyPeriodStart || undefined,
        studyPeriodEnd || undefined
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating deck:", error);
      setError("Failed to update deck. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-2 border-border shadow-bento !rounded-[2rem] bg-card max-h-[95dvh] flex flex-col">
        <DialogHeader className="flex flex-col items-center justify-center gap-3 border-b-2 border-border bg-tangerine px-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-border bg-white shadow-bento-sm">
            <PencilLine className="h-8 w-8 text-foreground" />
          </div>
          <div className="space-y-1 text-center">
            <DialogTitle className="font-editorial text-4xl text-foreground">Edit Deck</DialogTitle>
            <DialogDescription className="text-foreground/70 font-medium text-sm">
              Fine-tune the details, privacy, and folder for this deck.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              placeholder="Enter deck title"
              required
              disabled={isLoading}
              className={fieldStyles}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="Enter deck description"
              rows={3}
              disabled={isLoading}
              className={fieldStyles}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-folder" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Folder</Label>
            <div className="relative">
              <FolderGit2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <select
                id="edit-folder"
                className="w-full min-h-[48px] rounded-xl border-2 border-border bg-background px-4 py-2 pl-11 font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:border-foreground disabled:opacity-60 transition-colors"
                value={selectedFolderId ?? ""}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder._id} value={folder._id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Study Period (optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-muted-foreground">From</span>
                <input
                  type="date"
                  value={studyPeriodStart}
                  onChange={(e) => setStudyPeriodStart(e.target.value)}
                  disabled={isLoading}
                  className={fieldStyles + " w-full"}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-muted-foreground">Due by</span>
                <input
                  type="date"
                  value={studyPeriodEnd}
                  onChange={(e) => setStudyPeriodEnd(e.target.value)}
                  disabled={isLoading}
                  className={fieldStyles + " w-full"}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 transition-colors">
            <Switch
              id="edit-isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isLoading}
              className="data-[state=checked]:bg-foreground"
            />
            <div>
              <Label htmlFor="edit-isPublic" className="font-bold cursor-pointer text-base">
                Public Deck
              </Label>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Share knowledge with the community.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border-2 border-red-500 bg-red-100 px-4 py-3 text-sm font-bold text-red-900">
              {error}
            </div>
          )}

          <DialogFooter className="pt-2">
            <div className="flex w-full items-center justify-end gap-3">
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
                disabled={isLoading}
                className="h-12 px-8 rounded-xl border-2 border-border bg-foreground text-background font-bold hover:bg-foreground/90 hover:-translate-y-0.5 transition-transform"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDeckDialog;
