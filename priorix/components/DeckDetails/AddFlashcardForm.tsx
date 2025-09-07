import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";

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

  return (
    <div className="mb-8">
      <Card className="border-2 border-primary bg-green dark:bg-darkcard dark:border-darkborder">
        <CardHeader>
          <CardTitle className="text-xl">Add New Flashcard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="term" className="text-sm font-medium">
                Term
              </label>
              <Input
                id="term"
                ref={termInputRef}
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Enter the term"
                onFocus={handleInputFocus}
                onKeyDown={handleTermKeyDown}
                className="border-2 border-primary bg-skin"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="definition" className="text-sm font-medium">
                Definition
              </label>
              <Textarea
                id="definition"
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                placeholder="Enter the definition (Ctrl+Enter to save)"
                rows={5}
                onFocus={handleInputFocus}
                onKeyDown={handleDefinitionKeyDown}
                className="border-2 border-primary bg-skin"
              />
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            {(isAdding || newTerm || newDefinition) && (
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={cancelAdd}
                  className="order-2 sm:order-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={handleAddFlashcard}
                  disabled={
                    isSubmitting || !newTerm.trim() || !newDefinition.trim()
                  }
                  className="order-1 sm:order-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {isSubmitting ? "Adding..." : "Add Card"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFlashcardForm;
