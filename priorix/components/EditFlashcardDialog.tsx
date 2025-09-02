// components/EditFlashcardDialog.tsx
"use client";

import { useState, useEffect } from "react";
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
import { IFlashcard } from "@/types/flashcard";

interface EditFlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcard: IFlashcard;
  onSave: (id: string, term: string, definition: string) => void;
}

const EditFlashcardDialog = ({
  open,
  onOpenChange,
  flashcard,
  onSave,
}: EditFlashcardDialogProps) => {
  const [term, setTerm] = useState(flashcard.term);
  const [definition, setDefinition] = useState(flashcard.definition);

  useEffect(() => {
    setTerm(flashcard.term);
    setDefinition(flashcard.definition);
  }, [flashcard]);

  const handleSave = () => {
    if (term.trim() && definition.trim()) {
      onSave(flashcard._id, term.trim(), definition.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>
            Update the term and definition of your flashcard.
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
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditFlashcardDialog;
