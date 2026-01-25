"use client";

import { useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
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

const fetchFavoriteDecks = async (userId: string): Promise<Deck[]> => {
  const res = await fetch(`/api/favorites?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch favorite decks");
  return res.json();
};

const DecksPage = () => {
  const [isAddDeckModalOpen, setIsAddDeckModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const { data: session } = useSession();
  const { showToast, dismissToast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

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

  const {
    data: favoriteDecks = [],
    isLoading: isLoadingFavorites,
    isFetching: isFetchingFavorites,
    error: favoriteError,
  } = useQuery<Deck[]>({
    queryKey: ["favoriteDecks", session?.user?.id],
    queryFn: () => fetchFavoriteDecks(session?.user?.id!),
    enabled: !!session?.user?.id,
  });

  const createDeckMutation = useMutation<Deck, Error, CreateDeckRequest>({
    mutationFn: async (newDeck: CreateDeckRequest) => {
      const res = await fetch("/api/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newDeck, userId: session?.user?.id }),
      });
      if (!res.ok) throw new Error("Failed to create deck");
      return res.json();
    },
    onSuccess: (createdDeck) => {
      queryClient.invalidateQueries({ queryKey: ["decks", session?.user?.id] });
      setIsAddDeckModalOpen(false);
      dismissToast();
      showToast("Deck created successfully");
      if (createdDeck?._id) {
        router.push(`/decks/${createdDeck._id}`);
      }
    },
    onError: () => {
      dismissToast();
      showToast("Failed to create deck", "error");
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: async (deckId: string) => {
      const res = await fetch(`/api/deck/${deckId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete deck");
      return res.json();
    },
    onSuccess: (_, deckId) => {
      queryClient.invalidateQueries({ queryKey: ["decks", session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["favoriteDecks", session?.user?.id] });
      window.dispatchEvent(new CustomEvent("deck-deleted", { detail: { deckId } }));
      setDeleteModalOpen(false);
      setDeckToDelete(null);
      showToast("Deck deleted");
    },
    onError: () => {
      showToast("Failed to delete deck", "error");
    },
  });

  const editDeckMutation = useMutation({
    mutationFn: async ({
      deckId,
      title,
      description,
      isPublic,
    }: {
      deckId: string;
      title: string;
      description: string;
      isPublic: boolean;
    }) => {
      const res = await fetch(`/api/deck/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isPublic }),
      });
      if (!res.ok) throw new Error("Failed to update deck");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks", session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["favoriteDecks", session?.user?.id] });
      showToast("Deck updated");
    },
    onError: () => {
      showToast("Failed to update deck", "error");
    },
  });

  const handleAddDeck = useCallback(
    (deckData: CreateDeckRequest) => {
      createDeckMutation.mutate(deckData);
    },
    [createDeckMutation]
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

  const showLoadingState = isLoading || isFetching;
  const showFavoritesLoading = isLoadingFavorites || isFetchingFavorites;

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-muted rounded-xl p-3 md:p-4 h-32 border border-border/60"
        >
          <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
          <div className="h-3 bg-muted-foreground/20 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );

  const Section = ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children: ReactNode;
  }) => (
    <div className="rounded-2xl border-2 border-black dark:border-accent bg-card backdrop-blur-sm shadow-sm p-4 md:p-6">
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground font-sora">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="relative max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-8 pb-16 space-y-5">
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Deck"
        description="Are you sure you want to delete this deck? This action cannot be undone."
        isLoading={deleteDeckMutation.isPending}
      />

      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Overview</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Decks</h1>
          </div>
          <div className="gap-2 hidden md:flex">
            <Button className="bg-yellow text-foreground border-2 border-foreground"  onClick={() => setIsAddDeckModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2 text-foreground" /> New Deck
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <Section
            title="Your Decks"
            description="All decks you own. Edit, delete, or study."
          >
            {showLoadingState ? (
              renderSkeletonGrid()
            ) : error ? (
              <p className="text-center text-red-500 text-sm">
                Error loading your decks: {error.message}
              </p>
            ) : decks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {decks.map((deck: Deck, i: number) => (
                  <DeckCard
                    key={deck._id}
                    deck={deck}
                    index={i}
                    onDeleteClick={handleDeleteClick}
                    onEditClick={handleEditDeck}
                    queryClient={queryClient}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">
                  You don't have any decks yet. Create your first one!
                </p>
                <Button onClick={() => setIsAddDeckModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Deck
                </Button>
              </div>
            )}
          </Section>

          <Section
            title="Favorites"
            description="Decks you've starred for quick access."
          >
            {showFavoritesLoading ? (
              renderSkeletonGrid()
            ) : favoriteError ? (
              <p className="text-center text-red-500 text-sm">
                Error loading favorite decks: {favoriteError.message}
              </p>
            ) : favoriteDecks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {favoriteDecks.map((deck: Deck, i: number) => (
                  <DeckCard
                    key={deck._id}
                    deck={deck}
                    index={i}
                    onDeleteClick={handleDeleteClick}
                    onEditClick={handleEditDeck}
                    queryClient={queryClient}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">You haven’t favorited any decks yet.</p>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section
            title="Recently Accessed"
            description="Jump back into the decks you opened most recently."
          >
            <RecentDecks
              onDeleteClick={handleDeleteClick}
              onEditClick={handleEditDeck}
              showMenu
            />
          </Section>
        </div>
      </div>

     

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
