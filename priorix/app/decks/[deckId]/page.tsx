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
import { importPDF } from "@/utils/pdfImporter";
import { useDeckContext } from "@/contexts/DeckContext";

const DeckDetailPage = () => {
  const params = useParams();
  const deckId = params.deckId as string;
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);
  const { showToast } = useToast();
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

    try {
      const extractedFlashcards = await importPDF(file, importDeckId);
      await addMultipleFlashcards(extractedFlashcards);
      setShowImportModal(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to import PDF";
      setError(errorMessage);
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

  if (isDeckLoading || isFlashcardsLoading) {
    return <LoadingState />;
  }

  if (deckError && flashcardsError && !deck && flashcards.length === 0) {
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
    <div className="w-[90%] mx-auto py-2" key={retryKey}>
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
