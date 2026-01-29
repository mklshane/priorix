// components/decks/EditDeckDialog.tsx
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
    folderId: string | null
  ) => void;
  initialTitle: string;
  initialDescription: string;
  initialIsPublic: boolean;
  initialFolderId?: string | null;
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
  folders = [],
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [selectedFolderId, setSelectedFolderId] = useState<string | "" | null>(
    initialFolderId ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fieldStyles =
    "rounded-lg border border-border/60 bg-background/80 px-3 py-2 shadow-inner focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60";

  // Update form fields when initial values change
  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setIsPublic(initialIsPublic);
    setSelectedFolderId(initialFolderId ?? "");
  }, [initialTitle, initialDescription, initialIsPublic, initialFolderId]);

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
          : selectedFolderId
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
      <DialogContent className="modal-surface sm:max-w-[520px] p-0">
        <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-muted/40 to-transparent px-6 py-5">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
            <PencilLine className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-left">
            <DialogTitle className="text-xl">Edit Deck</DialogTitle>
            <DialogDescription>
              Fine-tune the details, privacy, and folder for this deck.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="edit-title">Title</Label>
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
          <div className="grid gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="Enter deck description"
              rows={3}
              disabled={isLoading}
              className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 shadow-inner focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-4 py-3 shadow-inner">
            <Switch
              id="edit-isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isLoading}
            />
            <div>
              <Label htmlFor="edit-isPublic" className="cursor-pointer">
                Make this deck public
              </Label>
              <p className="text-sm text-muted-foreground">
                Share knowledge with the community.
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-folder">Folder</Label>
            <div className="relative">
              <FolderGit2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="edit-folder"
                className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 pl-9 text-foreground shadow-inner focus:outline-hidden focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
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
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <DialogFooter className="border-t border-border/60 bg-background/40 px-1 pt-4">
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="shadow-[0_12px_30px_rgba(139,92,246,0.35)]"
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
