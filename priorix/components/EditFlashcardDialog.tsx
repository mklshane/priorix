
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
    "min-h-[48px] rounded-xl border-2 border-border bg-background px-4 py-2 font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:border-foreground transition-colors";

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
        className="sm:max-w-[480px] p-0 overflow-hidden border-2 border-border shadow-bento !rounded-[2rem] bg-card"
      >
        <DialogHeader className="flex flex-col items-center justify-center gap-3 border-b-2 border-border bg-lilac px-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-border bg-white shadow-bento-sm">
            <NotebookPen className="h-8 w-8 text-foreground" />
          </div>
          <div className="space-y-1 text-center">
            <DialogTitle className="font-editorial text-4xl text-foreground">Edit Flashcard</DialogTitle>
            <DialogDescription className="text-foreground/70 font-medium text-sm">
              Update the term and definition to keep this card sharp.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid gap-6 p-6 bg-card">
          <div className="space-y-2">
            <Label htmlFor="term" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Term</Label>
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
          <div className="space-y-2">
            <Label htmlFor="definition" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Definition</Label>
            <Textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Enter the definition"
              rows={4}
              className={fieldStyles}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        
        <DialogFooter className="px-6 pb-6 bg-card">
          <div className="flex w-full items-center justify-end gap-3">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="h-12 px-6 rounded-xl font-bold hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!term.trim() || !definition.trim()}
              className="h-12 px-8 rounded-xl border-2 border-border bg-foreground text-background font-bold hover:bg-foreground/90 hover:-translate-y-0.5 transition-transform disabled:opacity-50"
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
