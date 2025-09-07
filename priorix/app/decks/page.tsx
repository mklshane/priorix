"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DeckCard from "@/components/DeckCard";
import AddDeckModal from "@/components/Deck/AddDeckModal";
import RecentDecks from "@/components/dashboard/RecentDeck";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { Deck, CreateDeckRequest } from "@/types/deck";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const fetchDecks = async (userId: string): Promise<Deck[]> => {
  const res = await fetch(`/api/deck?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch decks");
  return res.json();
};

const DecksPage: React.FC = () => {
  const [isAddDeckModalOpen, setIsAddDeckModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const { data: session } = useSession();
  const { showToast, dismissToast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: decks = [],
    isLoading,
    isFetching,
    error,
  } = useQuery<Deck[]>({
    queryKey: ["decks", session?.user?.id],
    queryFn: () => fetchDecks(session?.user?.id!),
    enabled: !!session?.user?.id,
  });

  const addDeckMutation = useMutation({
    mutationFn: (newDeckData: CreateDeckRequest) =>
      fetch("/api/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDeckData,
          userId: session?.user?.id,
        }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create deck");
        return res.json();
      }),
    onMutate: () => showToast("Creating deck...", "loading"),
    onSuccess: (createdDeck: Deck) => {
      queryClient.setQueryData<Deck[]>(
        ["decks", session?.user?.id],
        (old = []) => [...old, createdDeck]
      );
      dismissToast();
      showToast("Deck created successfully!", "success");
      setIsAddDeckModalOpen(false);
    },
    onError: () => {
      dismissToast();
      showToast("Failed to create deck", "error");
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: (deckId: string) =>
      fetch(`/api/deck/${deckId}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete deck");
        return res;
      }),
    onMutate: () => showToast("Deleting deck...", "loading"),
    onSuccess: () => {
      queryClient.setQueryData<Deck[]>(
        ["decks", session?.user?.id],
        (old = []) => old.filter((deck) => deck._id !== deckToDelete)
      );
      dismissToast();
      showToast("Deck deleted successfully!", "success");
      setDeleteModalOpen(false);
      setDeckToDelete(null);
    },
    onError: () => {
      dismissToast();
      showToast("Failed to delete deck", "error");
    },
    onSettled: () => {
      setDeleteModalOpen(false);
      setDeckToDelete(null);
    },
  });

  const editDeckMutation = useMutation({
    mutationFn: ({
      deckId,
      title,
      description,
      isPublic,
    }: {
      deckId: string;
      title: string;
      description: string;
      isPublic: boolean;
    }) =>
      fetch(`/api/deck`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, title, description, isPublic }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update deck");
        return res.json();
      }),
    onMutate: () => showToast("Updating deck...", "loading"),
    onSuccess: (updatedDeck: Deck) => {
      queryClient.setQueryData<Deck[]>(
        ["decks", session?.user?.id],
        (old = []) =>
          old.map((deck) => (deck._id === updatedDeck._id ? updatedDeck : deck))
      );
      dismissToast();
      showToast("Deck updated successfully!", "success");
    },
    onError: () => {
      dismissToast();
      showToast("Failed to update deck", "error");
    },
  });

  const handleAddDeck = useCallback(
    (newDeckData: CreateDeckRequest) => {
      addDeckMutation.mutate(newDeckData);
    },
    [addDeckMutation]
  );

  const handleDeleteClick = useCallback((deckId: string) => {
    setDeckToDelete(deckId);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deckToDelete) deleteDeckMutation.mutate(deckToDelete);
  }, [deckToDelete, deleteDeckMutation]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setDeckToDelete(null);
  }, []);

  const handleEditDeck = useCallback(
    (deckId: string, title: string, description: string, isPublic: boolean) => {
      editDeckMutation.mutate({ deckId, title, description, isPublic });
    },
    [editDeckMutation]
  );

  // Show loading state during initial load or when refetching
  const showLoadingState = isLoading || isFetching;

  return (
    <div className="w-[90%] mx-auto">
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Deck"
        description="Are you sure you want to delete this deck? This action cannot be undone."
        isLoading={deleteDeckMutation.isPending}
      />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-sora text-foreground">
            Your Decks
          </h2>
        </div>

        {showLoadingState ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse bg-muted rounded-lg p-4 h-32"
              >
                <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-red-500 text-sm">
            Error loading your decks: {error.message}
          </p>
        ) : decks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {decks.map((deck: Deck, i: number) => (
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

      <div className="mb-8">
        <h2 className="text-2xl font-bold font-sora text-foreground mb-4">
          Recently Accessed
        </h2>
        <RecentDecks />
      </div>

      <Button
        onClick={() => setIsAddDeckModalOpen(true)}
        className="fixed bottom-8 right-8 rounded-full p-5 h-10 w-10"
      >
        <Plus className="h-20 w-20" />
      </Button>

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
