// components/AddFlashcardDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddFlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (term: string, definition: string) => void;
}

const AddFlashcardDialog = ({
  open,
  onOpenChange,
  onSave,
}: AddFlashcardDialogProps) => {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");

  const handleSave = () => {
    if (term.trim() && definition.trim()) {
      onSave(term.trim(), definition.trim());
      setTerm("");
      setDefinition("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Flashcard</DialogTitle>
          <DialogDescription>
            Create a new flashcard for your deck.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="term">Term</Label>
            <Input
              id="term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Enter the term"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="definition">Definition</Label>
            <Textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Enter the definition"
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFlashcardDialog;
