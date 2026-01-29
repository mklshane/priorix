
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IFlashcard } from "@/types/flashcard";
import { NotebookPen } from "lucide-react";

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

  const fieldStyles =
    "rounded-lg border border-border/60 bg-background/80 px-3 py-2 shadow-inner focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/30";

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
      if (e.key === "Enter" && !e.shiftKey) {
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
      <DialogContent
        onKeyDown={handleFormKeyPress}
        className="modal-surface sm:max-w-[520px] p-0"
      >
        <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-muted/40 to-transparent px-6 py-5">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
            <NotebookPen className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-left">
            <DialogTitle className="text-xl">Edit Flashcard</DialogTitle>
            <DialogDescription>
              Update the term and definition to keep this card sharp.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid gap-5 px-6 py-5">
          <div className="grid gap-2">
            <Label htmlFor="term">Term</Label>
            <Input
              id="term"
              ref={termInputRef}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Enter the term"
              className={fieldStyles}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
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
              className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 shadow-inner focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/30"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="border-t border-border/60 bg-background/40 px-6 py-4">
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!term.trim() || !definition.trim()}
              className="shadow-[0_12px_30px_rgba(139,92,246,0.35)]"
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditFlashcardDialog;
