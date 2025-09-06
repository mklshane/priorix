"use client";

import { useState, useEffect } from "react";
import DeckCard from "@/components/DeckCard";
import AddDeckModal from "@/components/Deck/AddDeckModal";
import RecentDecks from "@/components/dashboard/RecentDeck";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { Deck, CreateDeckRequest } from "@/types/deck";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const DecksPage: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddDeckModalOpen, setIsAddDeckModalOpen] = useState(false);
  const { data: session } = useSession();
  const { showToast, dismissToast } = useToast();

  useEffect(() => {
    const fetchDecks = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/deck?userId=${session.user.id}`);
        if (!res.ok) throw new Error("Failed to fetch decks");
        const data = await res.json();
        setDecks(data);
      } catch (err) {
        console.error("Error loading decks:", err);
        // Only show error toast if we didn't get any decks
        if (decks.length === 0) {
          showToast("Failed to load decks", "error");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDecks();
  }, [session?.user?.id, showToast]);

  const handleAddDeck = async (newDeckData: CreateDeckRequest) => {
    showToast("Creating deck...", "loading");

    try {
      const res = await fetch("/api/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDeckData,
          userId: session?.user?.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to create deck");

      const createdDeck: Deck = await res.json();
      setDecks((prev) => [...prev, createdDeck]);
      dismissToast();
      showToast("Deck created successfully!", "success");
      setIsAddDeckModalOpen(false);
    } catch (err) {
      console.error("Error creating deck:", err);
      dismissToast();
      showToast("Failed to create deck", "error");
    }
  };

  const handleDeleteClick = (deckId: string) => {
    setDeckToDelete(deckId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deckToDelete) return;

    setIsDeleting(true);
    showToast("Deleting deck...", "loading");

    try {
      const res = await fetch(`/api/deck/${deckToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete deck");

      setDecks((prev) => prev.filter((deck) => deck._id !== deckToDelete));
      dismissToast();
      showToast("Deck deleted successfully!", "success");
    } catch (err) {
      console.error("Error deleting deck:", err);
      dismissToast();
      showToast("Failed to delete deck", "error");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDeckToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDeckToDelete(null);
  };

  const handleEditDeck = async (
    deckId: string,
    title: string,
    description: string,
    isPublic: boolean
  ) => {
    showToast("Updating deck...", "loading");

    try {
      const res = await fetch(`/api/deck`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, title, description, isPublic }),
      });

      if (!res.ok) throw new Error("Failed to update deck");

      const updatedDeck: Deck = await res.json();
      setDecks((prev) =>
        prev.map((deck) => (deck._id === deckId ? updatedDeck : deck))
      );
      dismissToast();
      showToast("Deck updated successfully!", "success");
    } catch (err) {
      console.error("Error updating deck:", err);
      dismissToast();
      showToast("Failed to update deck", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="w-[90%] mx-auto min-h-screen py-8 flex items-center justify-center">
        <p>Loading decks...</p>
      </div>
    );
  }

  return (
    <div className="w-[90%] mx-auto">
      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Deck"
        description="Are you sure you want to delete this deck? This action cannot be undone."
        isLoading={isDeleting}
      />

      {/* Recent Decks Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-sora text-foreground mb-4">
          Recently Accessed
        </h2>
        <RecentDecks />
      </div>

      {/* User's Created Decks Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-sora text-foreground">
            Your Decks
          </h2>
        </div>

        {decks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {decks.map((deck, i) => (
              <DeckCard
                key={deck._id}
                deck={deck}
                index={i}
                onDeleteClick={handleDeleteClick}
                onEditClick={handleEditDeck}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You don't have any decks yet. Create your first one!
            </p>
            <Button onClick={() => setIsAddDeckModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Deck
            </Button>
          </div>
        )}
      </div>

      <Button
        onClick={() => setIsAddDeckModalOpen(true)}
        className="fixed bottom-8 right-8 rounded-full p-5 h-10 w-10"
      >
        <Plus className="h-20 w-20" />
      </Button>

      {/* Floating Action Button for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => setIsAddDeckModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <AddDeckModal
        open={isAddDeckModalOpen}
        onOpenChange={setIsAddDeckModalOpen}
        onAddDeck={handleAddDeck}
      />
    </div>
  );
};

export default DecksPage;
