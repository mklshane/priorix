// src/app/deck-details/hooks/useFlashcards.ts
import { useState, useEffect } from "react";
import { IFlashcard } from "@/types/flashcard";

export const useFlashcards = (deckId: string) => {
  const [flashcards, setFlashcards] = useState<IFlashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!deckId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/flashcard?deckId=${deckId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch flashcards");
        }

        const flashcardsData: IFlashcard[] = await response.json();
        setFlashcards(flashcardsData);
      } catch (err) {
        console.error("Error fetching flashcards:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load flashcards"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (deckId) {
      fetchFlashcards();
    }
  }, [deckId]);

  const addFlashcard = async (term: string, definition: string) => {
    try {
      const response = await fetch("/api/flashcard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          term: term.trim(),
          definition: definition.trim(),
          deck: deckId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create flashcard");
      }

      const newFlashcard = await response.json();
      setFlashcards([...flashcards, newFlashcard]);
      return newFlashcard;
    } catch (err) {
      console.error("Error creating flashcard:", err);
      throw err;
    }
  };

  const updateFlashcard = async (
    id: string,
    term: string,
    definition: string
  ) => {
    try {
      const response = await fetch("/api/flashcard", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          term,
          definition,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update flashcard");
      }

      const updatedFlashcard = await response.json();
      setFlashcards(
        flashcards.map((fc) => (fc._id === id ? updatedFlashcard : fc))
      );
      return updatedFlashcard;
    } catch (err) {
      console.error("Error updating flashcard:", err);
      throw err;
    }
  };

  const deleteFlashcard = async (id: string) => {
    try {
      const response = await fetch(`/api/flashcard?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete flashcard");
      }

      setFlashcards(flashcards.filter((fc) => fc._id !== id));
    } catch (err) {
      console.error("Error deleting flashcard:", err);
      throw err;
    }
  };

 
  const addMultipleFlashcards = async (
    flashcards: Omit<IFlashcard, "id" | "createdAt" | "updatedAt">[]
  ) => {
  
  };

  return {
    flashcards,
    isLoading,
    error,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    addMultipleFlashcards
  };
};
