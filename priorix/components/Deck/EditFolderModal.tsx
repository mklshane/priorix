"use client";

import React, { useEffect, useState } from "react";
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

interface EditFolderModalProps {
  open: boolean;
  initialName: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}

const EditFolderModal: React.FC<EditFolderModalProps> = ({
  open,
  initialName,
  onOpenChange,
  onSubmit,
}) => {
  const [name, setName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(initialName);
    setError("");
    setIsLoading(false);
  }, [initialName, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Folder name is required");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      await onSubmit(name.trim());
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to rename folder");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
          <DialogDescription>Update this folder's name.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="folder-name">Folder name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFolderModal;
