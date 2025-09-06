"use client"

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
import { importPDF } from "@/utils/pdfImporter";
import { useDeckContext } from "@/contexts/DeckContext";

const DeckDetailPage = () => {
  const params = useParams();
  const deckId = params.deckId as string;
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);
  const { showToast, dismissToast } = useToast();
  const { data: session } = useSession();

  const { deck, isLoading: isDeckLoading, error: deckError } = useDeck(deckId);
  const {
    flashcards,
    isLoading: isFlashcardsLoading,
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
  const { isOwner, setDeck } = useDeckContext();

  useEffect(() => {
    if (deck) {
      setDeck(deck);
    }
  }, [deck, setDeck]);

  const handleStudyDeck = () => {
    router.push(`/decks/${deckId}/study`);
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

  const handleImportPDF = async (file: File, importDeckId: string) => {
    if (!isOwner) {
      showToast("Only deck owners can import cards", "error");
      return;
    }

    setIsImporting(true);
    setError(null);
    showToast("Importing PDF...", "loading");

    try {
      const extractedFlashcards = await importPDF(file, importDeckId);
      await addMultipleFlashcards(extractedFlashcards);

      dismissToast();
      showToast("Flashcards imported successfully!", "success");
      setShowImportModal(false);
    } catch (err) {
      console.error("PDF import error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to import PDF";
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

    showToast("Creating flashcard...", "loading");

    try {
      await addFlashcard(term, definition);
      setError(null);
      dismissToast();
      showToast("Flashcard created successfully!", "success");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create flashcard";
      setError(errorMessage);
      dismissToast();
      showToast(errorMessage, "error");
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

    showToast("Updating flashcard...", "loading");

    try {
      await updateFlashcard(id, term, definition);
      setEditingFlashcard(null);
      setError(null);
      dismissToast();
      showToast("Flashcard updated successfully!", "success");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update flashcard";
      setError(errorMessage);
      dismissToast();
      showToast(errorMessage, "error");
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    if (!isOwner) {
      showToast("Only deck owners can delete cards", "error");
      return;
    }

    showToast("Deleting flashcard...", "loading");

    try {
      await deleteFlashcard(id);
      setError(null);
      dismissToast();
      showToast("Flashcard deleted successfully!", "success");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete flashcard";
      setError(errorMessage);
      dismissToast();
      showToast(errorMessage, "error");
    }
  };

  if (isDeckLoading || isFlashcardsLoading) {
    return <LoadingState />;
  }

  if ((deckError && !deck) || (flashcardsError && flashcards.length === 0)) {
    const errorMessage = deckError || flashcardsError || "Failed to load data";
    return (
      <ErrorState
        error={errorMessage}
        onRetry={() => {
          window.location.reload();
        }}
      />
    );
  }

  if (!deck) {
    return <NotFoundState />;
  }

  return (
    <div className="w-[90%] mx-auto py-2">
      <ImportModal
        isOpen={showImportModal}
        onClose={handleCloseImportModal}
        onImport={handleImportPDF}
        deckId={deckId}
      />

      <DeckHeader
        deck={deck}
        flashcards={flashcards}
        onStudyDeck={handleStudyDeck}
        onImportPDF={isOwner ? handleOpenImportModal : undefined}
      />

      {isImporting && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-md">
          Importing PDF... This may take a moment.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
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
