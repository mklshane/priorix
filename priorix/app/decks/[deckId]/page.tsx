"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
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
import ImportModal from "@/components/DeckDetails/ImportModal";
import StudyModeModal from "@/components/DeckDetails/StudyModeModal";
import { useDeckContext } from "@/contexts/DeckContext";
import { useQueryClient } from "@tanstack/react-query";

const DeckDetailPage = () => {
  const params = useParams();
  const deckId = params.deckId as string;
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const { showToast, dismissToast } = useToast();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const {
    deck,
    isLoading: isDeckLoading,
    isFetching: isDeckFetching,
    error: deckError,
  } = useDeck(deckId);
  const {
    flashcards,
    isLoading: isFlashcardsLoading,
    isFetching: isFlashcardsFetching,
    error: flashcardsError,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    addMultipleFlashcards,
  } = useFlashcards(deckId);

  const [editingFlashcard, setEditingFlashcard] = useState<IFlashcard | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const { isOwner, setDeck } = useDeckContext();

  useEffect(() => {
    setError(null);
    setRetryKey((prev) => prev + 1);
  }, [deckId]);

  useEffect(() => {
    if (deck) {
      setDeck(deck);
    }
  }, [deck, setDeck]);

  const handleStudyClick = () => {
    setShowStudyModal(true);
  };

  const handleSelectStudyMode = (mode: "flashcards" | "srs" | "quiz") => {
    setShowStudyModal(false);
    if (mode === "flashcards") {
      router.push(`/decks/${deckId}/study`);
    } else if (mode === "srs") {
      router.push(`/decks/${deckId}/study-srs`);
    } else if (mode === "quiz") {
      router.push(`/decks/${deckId}/quiz`);
    }
  };

  const handleOpenImportModal = () => {
    if (!isOwner) {
      showToast("Only deck owners can import cards", "error");
      return;
    }
    setShowImportModal(true);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
  };

  const handleImportGenerate = async (text: string, importDeckId: string) => {
    if (!isOwner) {
      showToast("Only deck owners can import cards", "error");
      return;
    }

    const boundedText = text.length > 45000 ? text.slice(0, 45000) : text;

    setIsImporting(true);
    setError(null);
    const toastId = showToast("Importing flashcards...", "loading");

    try {
      const response = await fetch("/api/ai/generate-and-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: boundedText, deckId: importDeckId }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error || "Failed to generate flashcards");
      }

      const newFlashcards = await response.json();

      // Update client-side cache
      queryClient.setQueryData<IFlashcard[]>(
        ["flashcards", deckId, session?.user?.id],
        (old = []) => [...old, ...newFlashcards]
      );

      dismissToast();
      showToast("Flashcards imported successfully!", "success");
      setShowImportModal(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to import content";
      setError(errorMessage);
      dismissToast();
      showToast(errorMessage, "error");
      throw err;
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddFlashcard = async (term: string, definition: string) => {
    if (!isOwner) {
      showToast("Only deck owners can add cards", "error");
      return;
    }

    try {
      await addFlashcard({ term, definition });
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create flashcard";
      setError(errorMessage);
      throw err;
    }
  };

  const handleUpdateFlashcard = async (
    id: string,
    term: string,
    definition: string
  ) => {
    if (!isOwner) {
      showToast("Only deck owners can edit cards", "error");
      return;
    }

    try {
      await updateFlashcard({ id, term, definition });
      setEditingFlashcard(null);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update flashcard";
      setError(errorMessage);
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    if (!isOwner) {
      showToast("Only deck owners can delete cards", "error");
      return;
    }

    try {
      await deleteFlashcard(id);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete flashcard";
      setError(errorMessage);
    }
  };

  // Only show loading on initial load, not on refetches
  // If we have data already loaded, don't show loading state
  const isPending =
    ((isDeckLoading || isDeckFetching) && !deck) ||
    ((isFlashcardsLoading || isFlashcardsFetching) && flashcards.length === 0);

  if (isPending) {
    return <LoadingState />;
  }

  const bothFailed = deckError && flashcardsError;

  if (!isPending && bothFailed && !deck && flashcards.length === 0) {
    const errorMessage = deckError || flashcardsError || "Failed to load data";
    return (
      <ErrorState
        error={errorMessage}
        onRetry={() => {
          setError(null);
          setRetryKey((prev) => prev + 1);
        }}
      />
    );
  }

  if (!deck) {
    return <NotFoundState />;
  }

  return (
    <div className="min-h-screen p-4 md:p-6 mx-auto" key={retryKey}>
      <ImportModal
        isOpen={showImportModal}
        onClose={handleCloseImportModal}
        onImport={handleImportGenerate}
        deckId={deckId}
      />

      <StudyModeModal
        isOpen={showStudyModal}
        onClose={() => setShowStudyModal(false)}
        onSelectMode={handleSelectStudyMode}
        hasCards={flashcards.length > 0}
      />

      <DeckHeader
        deck={deck}
        flashcards={flashcards}
        onStudyClick={handleStudyClick}
        onImportPDF={isOwner ? handleOpenImportModal : undefined}
      />

      {isImporting && (
        <div className="mb-5 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-sm font-medium">
            Generating flashcards from your document... This may take a moment.
          </span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {isOwner && (
        <AddFlashcardForm
          onAddFlashcard={handleAddFlashcard}
          error={error}
          setError={setError}
        />
      )}

      <FlashcardsList
        flashcards={flashcards}
        onEdit={isOwner ? setEditingFlashcard : undefined}
        onDelete={isOwner ? handleDeleteFlashcard : undefined}
        isOwner={isOwner}
      />

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
