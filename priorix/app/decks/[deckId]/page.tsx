"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IFlashcard } from "@/types/flashcard";
import EditFlashcardDialog from "@/components/EditFlashcardDialog";
import { useDeck } from "@/hooks/useDeck";
import { useFlashcards } from "@/hooks/useFlashcards";
import DeckHeader from "@/components/DeckDetails/DeckHeader";
import AddFlashcardForm from "@/components/DeckDetails/AddFlashcardForm";
import FlashcardsList from "@/components/DeckDetails/FlashcardsList";
import LoadingState from "@/components/DeckDetails/LoadingState";
import ErrorState from "@/components/DeckDetails/ErrorState";
import NotFoundState from "@/components/DeckDetails/NotFoundState";

const DeckDetailPage = () => {
  const params = useParams();
  const { data: session } = useSession();
  const deckId = params.deckId as string;
  const router = useRouter();

  const { deck, isLoading: isDeckLoading, error: deckError } = useDeck(deckId);
  const {
    flashcards,
    isLoading: isFlashcardsLoading,
    error: flashcardsError,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
  } = useFlashcards(deckId);

  const [editingFlashcard, setEditingFlashcard] = useState<IFlashcard | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleStudyDeck = () => {
    // Navigate to study mode
    console.log("Start studying deck:", deckId);
    router.push(`/decks/${deckId}/study`)
  };

  const handleAddFlashcard = async (term: string, definition: string) => {
    try {
      await addFlashcard(term, definition);
      setError(null);
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateFlashcard = async (
    id: string,
    term: string,
    definition: string
  ) => {
    try {
      await updateFlashcard(id, term, definition);
      setEditingFlashcard(null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update flashcard"
      );
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    try {
      await deleteFlashcard(id);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete flashcard"
      );
    }
  };

  if (isDeckLoading || isFlashcardsLoading) {
    return <LoadingState />;
  }

  if (deckError && !deck) {
    return (
      <ErrorState error={deckError} onRetry={() => window.location.reload()} />
    );
  }

  if (!deck) {
    return <NotFoundState />;
  }

  return (
    <div className="w-[90%] mx-auto py-2">
      <DeckHeader
        deck={deck}
        flashcards={flashcards}
        onStudyDeck={handleStudyDeck}
      />

      <AddFlashcardForm
        onAddFlashcard={handleAddFlashcard}
        error={error}
        setError={setError}
      />

      <FlashcardsList
        flashcards={flashcards}
        onEdit={setEditingFlashcard}
        onDelete={handleDeleteFlashcard}
      />

      {/* Edit Flashcard Dialog */}
      {editingFlashcard && (
        <EditFlashcardDialog
          open={!!editingFlashcard}
          onOpenChange={(open) => !open && setEditingFlashcard(null)}
          flashcard={editingFlashcard}
          onSave={handleUpdateFlashcard}
        />
      )}
    </div>
  );
};

export default DeckDetailPage;
