
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const termInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTerm(flashcard.term);
    setDefinition(flashcard.definition);
  }, [flashcard]);

  useEffect(() => {
    if (open && termInputRef.current) {
      setTimeout(() => {
        termInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSave = useCallback(() => {
    if (term.trim() && definition.trim()) {
      onSave(flashcard._id, term.trim(), definition.trim());
    }
  }, [term, definition, flashcard._id, onSave]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  const handleFormKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter"  && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={handleFormKeyPress}>
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
              ref={termInputRef}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Enter the term"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // Move focus to definition textarea on Enter
                  document.getElementById("definition")?.focus();
                }
              }}
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!term.trim() || !definition.trim()}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditFlashcardDialog;
