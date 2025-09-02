"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Calendar, User, Edit, Trash2 } from "lucide-react";
import { Deck } from "@/types/deck";
import { IFlashcard } from "@/types/flashcard";
import AddFlashcardDialog from "@/components/AddFlashcardDialog";
import EditFlashcardDialog from "@/components/EditFlashcardDialog";

const DeckDetailPage = () => {
  const params = useParams();
  const { data: session } = useSession();
  const deckId = params.deckId as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<IFlashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<IFlashcard | null>(
    null
  );

  useEffect(() => {
    const fetchDeck = async () => {
      if (!deckId || !session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch deck details
        const deckResponse = await fetch(
          `/api/deck?id=${deckId}&userId=${session.user.id}`
        );

        if (!deckResponse.ok) {
          if (deckResponse.status === 404) {
            throw new Error("Deck not found");
          }
          throw new Error("Failed to fetch deck");
        }

        const deckData: Deck = await deckResponse.json();
        setDeck(deckData);
      } catch (err) {
        console.error("Error fetching deck:", err);
        setError(err instanceof Error ? err.message : "Failed to load deck");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeck();
  }, [deckId, session?.user?.id]);

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!deckId) return;

      try {
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
      }
    };

    if (deckId) {
      fetchFlashcards();
    }
  }, [deckId]);

  const handleAddFlashcard = async (term: string, definition: string) => {
    try {
      const response = await fetch("/api/flashcard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          term,
          definition,
          deck: deckId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create flashcard");
      }

      const newFlashcard = await response.json();
      setFlashcards([...flashcards, newFlashcard]);
      setShowAddDialog(false);
    } catch (err) {
      console.error("Error creating flashcard:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create flashcard"
      );
    }
  };

  const handleUpdateFlashcard = async (
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
      setEditingFlashcard(null);
    } catch (err) {
      console.error("Error updating flashcard:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update flashcard"
      );
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
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
      setError(
        err instanceof Error ? err.message : "Failed to delete flashcard"
      );
    }
  };

  const handleStudyDeck = () => {
    // Navigate to study mode
    console.log("Start studying deck:", deckId);
    // You can implement navigation to study page here
  };

  if (isLoading) {
    return (
      <div className="w-[90%] mx-auto min-h-screen py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading deck...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[90%] mx-auto min-h-screen py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <BookOpen className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Deck</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="w-[90%] mx-auto min-h-screen py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground mb-4">
              <BookOpen className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Deck Not Found</h2>
            <p className="text-muted-foreground">
              The deck you're looking for doesn't exist or you don't have access
              to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="w-[90%] mx-auto py-8">
      {/* Deck Header */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold mb-2">
                  {deck.title}
                </CardTitle>
                {deck.description && (
                  <p className="text-muted-foreground mb-4">
                    {deck.description}
                  </p>
                )}

                {/* Deck Stats */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{flashcards.length} flashcards</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(deck.createdAt)}</span>
                  </div>
                  {deck.isPublic && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Public deck</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Card
                </Button>
                {flashcards.length > 0 && (
                  <Button
                    onClick={handleStudyDeck}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Study Now
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Flashcards Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Flashcards</h2>

        {flashcards.length === 0 ? (
          // No flashcards prompt
          <Card className="border-2 border-dashed border-muted-foreground/25">
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground mb-6">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  No flashcards yet
                </h3>
                <p className="text-sm max-w-md mx-auto">
                  This deck doesn't have any flashcards yet. Add your first
                  flashcard to get started with studying!
                </p>
              </div>

              <Button
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add Your First Flashcard
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Display flashcards
          <div className="grid gap-4">
            {flashcards.map((flashcard, index) => (
              <Card
                key={flashcard._id || index}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Term
                      </h4>
                      <p className="text-sm">{flashcard.term}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Definition
                      </h4>
                      <p className="text-sm">{flashcard.definition}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingFlashcard(flashcard)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteFlashcard(flashcard._id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Flashcard Dialog */}
      <AddFlashcardDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={handleAddFlashcard}
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
