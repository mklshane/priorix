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
    "min-h-[48px] rounded-xl border-2 border-border bg-background px-4 py-2 font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:border-foreground disabled:opacity-60 transition-colors";

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
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-2 border-border shadow-bento !rounded-[2rem] bg-card">
        <DialogHeader className="flex flex-col items-center justify-center gap-3 border-b-2 border-border bg-sky px-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-border bg-white shadow-bento-sm">
            <FolderPlus className="h-8 w-8 text-foreground" />
          </div>
          <div className="space-y-1 text-center">
            <DialogTitle className="font-editorial text-4xl text-foreground">Create Folder</DialogTitle>
            <DialogDescription className="text-foreground/70 font-medium text-sm">
              Organize decks by grouping them into a folder.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-card">
          <div className="space-y-2">
            <Label htmlFor="folder-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Folder name</Label>
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
            <p className="rounded-xl border-2 border-red-500 bg-red-100 px-4 py-3 text-sm font-bold text-red-900">
              {error}
            </p>
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
