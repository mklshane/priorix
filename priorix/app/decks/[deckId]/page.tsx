"use client";

import React, { useState, useRef } from "react";
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
import { importPDF } from "@/utils/pdfImporter";

const DeckDetailPage = () => {
  const params = useParams();
  const { data: session } = useSession();
  const deckId = params.deckId as string;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportPDF = () => {
  
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please select a PDF file");
      return;
    }

    setIsImporting(true);
    try {
      // Extract text from PDF and process it into flashcards
      const extractedFlashcards = await importPDF(file);

      // Add the extracted flashcards to the deck
      await addMultipleFlashcards(extractedFlashcards);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import PDF");
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
      {/* Hidden file input for PDF import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".pdf"
        className="hidden"
      />

      <DeckHeader
        deck={deck}
        flashcards={flashcards}
        onStudyDeck={handleStudyDeck}
        onImportPDF={handleImportPDF} // Pass the handler
      />

      {isImporting && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-md">
          Importing PDF... This may take a moment.
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
