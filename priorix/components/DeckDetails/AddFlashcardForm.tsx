import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Keyboard, PenLine } from "lucide-react";

interface AddFlashcardFormProps {
  onAddFlashcard: (term: string, definition: string) => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

const AddFlashcardForm = ({
  onAddFlashcard,
  error,
  setError,
}: AddFlashcardFormProps) => {
  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const termInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && termInputRef.current) {
      termInputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddFlashcard = async () => {
    if (!newTerm.trim() || !newDefinition.trim()) {
      setError("Both term and definition are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const formattedDefinition = newDefinition.replace(/\r\n/g, "\n");
      await onAddFlashcard(newTerm, formattedDefinition);
      setNewTerm("");
      setNewDefinition("");
      setIsAdding(false);
    } catch (err) {
      console.error("Error creating flashcard:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create flashcard"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelAdd = () => {
    setNewTerm("");
    setNewDefinition("");
    setIsAdding(false);
    setError(null);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isAdding || newTerm || newDefinition)) {
        e.preventDefault();
        cancelAdd();
      }
    },
    [isAdding, newTerm, newDefinition]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleTermKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("definition")?.focus();
    }
  };

  const handleDefinitionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddFlashcard();
    }
  };

  const handleInputFocus = () => {
    if (!isAdding) {
      setIsAdding(true);
    }
  };

  // Collapsed state - just show button
  if (!isAdding && !newTerm && !newDefinition) {
    return (
      <div className="mb-8">
        <Button
          onClick={() => setIsAdding(true)}
          className="w-full h-12 border-2 border-dashed border-primary/40 dark:border-darkborder bg-green/30 dark:bg-green/10 hover:bg-green/50 dark:hover:bg-green/20 text-foreground hover:border-primary/60 transition-all duration-200 rounded-xl gap-2 font-semibold"
          variant="ghost"
        >
          <Plus className="h-5 w-5" />
          Add New Flashcard
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Card className="border-2 border-primary bg-green dark:bg-darkcard dark:border-darkborder overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-green via-perry to-green" />

        <CardContent className="pt-5 pb-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-foreground/10">
              <PenLine className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-bold">New Flashcard</h3>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="term" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Term
                </label>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Keyboard className="h-3 w-3" /> Enter to move to definition
                </span>
              </div>
              <Input
                id="term"
                ref={termInputRef}
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Enter the term"
                onFocus={handleInputFocus}
                onKeyDown={handleTermKeyDown}
                className="border-2 border-primary/60 dark:border-darkborder bg-skin dark:bg-card focus:border-primary transition-colors h-11"
              />
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="definition" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Definition
                </label>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Keyboard className="h-3 w-3" /> Ctrl+Enter to save
                </span>
              </div>
              <Textarea
                id="definition"
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                placeholder="Enter the definition"
                rows={4}
                onFocus={handleInputFocus}
                onKeyDown={handleDefinitionKeyDown}
                className="border-2 border-primary/60 dark:border-darkborder bg-skin dark:bg-card focus:border-primary transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg border border-red-200 dark:border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-1">
              <Button
                variant="outline"
                onClick={cancelAdd}
                className="order-2 sm:order-1 border-2 border-primary/40 dark:border-darkborder"
              >
                <X className="h-4 w-4 mr-1.5" />
                Cancel
              </Button>
              <Button
                onClick={handleAddFlashcard}
                disabled={
                  isSubmitting || !newTerm.trim() || !newDefinition.trim()
                }
                className="order-1 sm:order-2 bg-purple dark:bg-purple/80 text-foreground border-2 border-primary dark:border-darkborder font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-150"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {isSubmitting ? "Adding..." : "Add Card"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFlashcardForm;
