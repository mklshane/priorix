import { useState, useRef, useEffect, useCallback } from "react";
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

  if (!isAdding && !newTerm && !newDefinition) {
    return (
      <div className="mb-8">
        <Button
          onClick={() => setIsAdding(true)}
          className="w-full h-14 border-2 border-dashed border-border bg-transparent hover:bg-mint text-foreground hover:-translate-y-1 hover:shadow-bento-sm transition-all duration-300 rounded-2xl gap-2 font-bold text-lg"
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
      <div className="border-2 border-border bg-mint rounded-3xl overflow-hidden shadow-bento-sm">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-background border-2 border-border">
              <PenLine className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-editorial">New Flashcard</h3>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="term" className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">
                  Term
                </label>
                <span className="text-[10px] text-foreground/60 flex items-center gap-1 uppercase tracking-wider font-bold">
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
                className="border-2 border-border bg-background focus:-translate-y-1 focus:shadow-bento-sm transition-all focus-visible:ring-0 focus-visible:border-border h-12 rounded-xl text-base"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="definition" className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">
                  Definition
                </label>
                <span className="text-[10px] text-foreground/60 flex items-center gap-1 uppercase tracking-wider font-bold">
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
                className="border-2 border-border bg-background focus:-translate-y-1 focus:shadow-bento-sm transition-all focus-visible:ring-0 focus-visible:border-border rounded-xl resize-none text-base p-4"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-100 px-4 py-3 rounded-xl border-2 border-red-200 font-medium">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={cancelAdd}
                className="order-2 sm:order-1 border-2 border-border bg-transparent hover:bg-background rounded-full px-6 transition-all h-12 font-bold"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleAddFlashcard}
                disabled={
                  isSubmitting || !newTerm.trim() || !newDefinition.trim()
                }
                className="order-1 sm:order-2 bg-primary text-primary-foreground border-2 border-border font-bold rounded-full px-8 h-12 hover:-translate-y-1 hover:shadow-bento-sm transition-all duration-300 active:translate-y-0 active:shadow-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Adding..." : "Add Card"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFlashcardForm;
