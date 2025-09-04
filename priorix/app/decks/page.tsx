"use client";

import { useState, useEffect } from "react";
import DeckCard from "@/components/DeckCard";
import AddDeckModal from "@/components/Deck/AddDeckModal";
import RecentDecks from "@/components/dashboard/RecentDeck";
import { Deck, CreateDeckRequest } from "@/types/deck";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";

const DecksPage: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        showToast("Failed to load decks", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDecks();
    console.log("Fetching decks successful");
  }, [session?.user?.id]);

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
    } catch (err) {
      console.error("Error creating deck:", err);
      dismissToast();
      showToast("Failed to create deck", "error");
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this deck? This action cannot be undone."
      )
    ) {
      return;
    }

    showToast("Deleting deck...", "loading");

    try {
      const res = await fetch(`/api/deck/${deckId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete deck");

      setDecks((prev) => prev.filter((deck) => deck._id !== deckId));
      dismissToast();
      showToast("Deck deleted successfully!", "success");
    } catch (err) {
      console.error("Error deleting deck:", err);
      dismissToast();
      showToast("Failed to delete deck", "error");
    }
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
                onDeleteClick={handleDeleteDeck}
                onEditClick={handleEditDeck}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              You don't have any decks yet. Create your first one!
            </p>
          </div>
        )}
      </div>

      <AddDeckModal onAddDeck={handleAddDeck} />
    </div>
  );
};

export default DecksPage;
