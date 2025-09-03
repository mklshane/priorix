"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast"; // Import toast library
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

const DeckDetailPage = () => {
  const params = useParams();
  const { data: session } = useSession();
  const deckId = params.deckId as string;
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);

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

  const handleStudyDeck = () => {
    router.push(`/decks/${deckId}/study`);
  };

  const handleOpenImportModal = () => {
    setShowImportModal(true);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
  };

  const handleImportPDF = async (file: File, importDeckId: string) => {
    setIsImporting(true);
    setError(null);

    try {
      const extractedFlashcards = await importPDF(file, importDeckId);

      // Show success toast for PDF import
      toast.success("Flashcards imported successfully!");

      window.location.reload();
    } catch (err) {
      console.error("PDF import error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to import PDF";
      setError(errorMessage);
      toast.error(errorMessage); // Show error toast
      throw err;
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddFlashcard = async (term: string, definition: string) => {
    try {
      await addFlashcard(term, definition);
      setError(null);
      toast.success("Flashcard created successfully!"); // Success toast for adding
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create flashcard";
      toast.error(errorMessage); // Error toast for adding
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
      toast.success("Flashcard updated successfully!"); // Success toast for updating
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update flashcard";
      setError(errorMessage);
      toast.error(errorMessage); // Error toast for updating
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    try {
      await deleteFlashcard(id);
      setError(null);
      toast.success("Flashcard deleted successfully!"); // Success toast for deleting
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete flashcard";
      setError(errorMessage);
      toast.error(errorMessage); // Error toast for deleting
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
        onImportPDF={handleOpenImportModal}
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
