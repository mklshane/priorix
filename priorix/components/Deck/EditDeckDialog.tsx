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

interface EditDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditSubmit: (title: string, description: string, isPublic: boolean) => void;
  initialTitle: string;
  initialDescription: string;
  initialIsPublic: boolean;
}

const EditDeckDialog: React.FC<EditDeckDialogProps> = ({
  open,
  onOpenChange,
  onEditSubmit,
  initialTitle,
  initialDescription,
  initialIsPublic,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Update form fields when initial values change
  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setIsPublic(initialIsPublic);
  }, [initialTitle, initialDescription, initialIsPublic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onEditSubmit(title.trim(), description.trim(), isPublic);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Deck</DialogTitle>
          <DialogDescription>
            Make changes to your flashcard deck. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isLoading}
              />
              <Label htmlFor="edit-isPublic">Make this deck public</Label>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDeckDialog;
