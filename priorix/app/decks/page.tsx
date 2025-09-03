"use client";

import { useState, useEffect } from "react";
import DeckCard from "@/components/DeckCard";
import AddDeckModal from "@/components/Deck/AddDeckModal";
import { Deck, CreateDeckRequest } from "@/types/deck";
import { useSession } from "next-auth/react";

const DecksPage: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

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
     } finally {
       setIsLoading(false);
     }
   };

   fetchDecks();
 }, [session?.user?.id]);


  const handleAddDeck = async (newDeckData: CreateDeckRequest) => {
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
    } catch (err) {
      console.error("Error creating deck:", err);
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

    try {
      const res = await fetch(`/api/deck/${deckId}`, {
        method: "DELETE",
      });


      if (!res.ok) throw new Error("Failed to delete deck");

      setDecks((prev) => prev.filter((deck) => deck._id !== deckId));
    } catch (err) {
      console.error("Error deleting deck:", err);
      alert("Failed to delete deck. Please try again.");
    }
  };

 

  const handleEditDeck = async (
    deckId: string,
    title: string,
    description: string,
    isPublic: boolean
  ) => {
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
    } catch (err) {
      console.error("Error updating deck:", err);
      alert("Failed to update deck. Please try again.");
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
    <div className="w-[80%] mx-auto py-4">
      

      {decks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <AddDeckModal onAddDeck={handleAddDeck} />
    </div>
  );
};

export default DecksPage;
