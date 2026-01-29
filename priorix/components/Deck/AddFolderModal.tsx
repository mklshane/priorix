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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";

interface AddFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}

const AddFolderModal: React.FC<AddFolderModalProps> = ({
  open,
  onOpenChange,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fieldStyles =
    "rounded-lg border border-border/60 bg-background/80 px-3 py-2 shadow-inner focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60";

  useEffect(() => {
    if (!open) {
      setName("");
      setError("");
      setIsLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Folder name is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await onCreate(name.trim());
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to create folder");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-surface sm:max-w-[460px] p-0">
        <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-muted/40 to-transparent px-6 py-5">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
            <FolderPlus className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-left">
            <DialogTitle className="text-xl">Create Folder</DialogTitle>
            <DialogDescription className="text-xs">
              Organize decks by grouping them into a folder.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="grid gap-2">
            <Label htmlFor="folder-name">Folder name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Biology"
              disabled={isLoading}
              required
              className={fieldStyles}
            />
          </div>
          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
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
                {isLoading ? "Creating..." : "Create Folder"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFolderModal;
