"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DeckCard from "@/components/DeckCard";
import AddDeckModal from "@/components/Deck/AddDeckModal";
import AddFolderModal from "@/components/Deck/AddFolderModal";
import EditFolderModal from "@/components/Deck/EditFolderModal";
import FolderCard from "@/components/Deck/FolderCard";
import RecentDecks from "@/components/dashboard/RecentDeck";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { Deck, CreateDeckRequest } from "@/types/deck";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import { useFolders } from "@/hooks/useFolders";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fetchDecks = async (
  userId: string,
  folderId?: string | null,
): Promise<Deck[]> => {
  const params = new URLSearchParams({ userId });
  if (folderId === null) {
    params.append("folderId", "null");
  } else if (folderId) {
    params.append("folderId", folderId);
  }

  const res = await fetch(`/api/deck?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch decks");
  return res.json();
};

const fetchFavoriteDecks = async (userId: string): Promise<Deck[]> => {
  const res = await fetch(`/api/favorites?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch favorite decks");
  return res.json();
};

type DeckTab = "workspace" | "favorites" | "recent";

const DecksPage = () => {
  const [isAddDeckModalOpen, setIsAddDeckModalOpen] = useState(false);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isCreateChooserOpen, setIsCreateChooserOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DeckTab>("workspace");
  const { data: session } = useSession();
  const { showToast, dismissToast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    folders = [],
    isLoading: isLoadingFolders,
    createFolder,
    deleteFolder,
    renameFolder,
  } = useFolders(session?.user?.id);

  // Sync folder state with URL query (?folderId=...)
  useEffect(() => {
    const folderFromQuery = searchParams?.get("folderId");
    if (folderFromQuery === null) {
      setCurrentFolderId(null);
    } else if (folderFromQuery) {
      setCurrentFolderId(folderFromQuery);
    }
  }, [searchParams]);

  const {
    data: decks = [],
    isLoading,
    isFetching,
    error,
  } = useQuery<Deck[]>({
    queryKey: ["decks", session?.user?.id, currentFolderId ?? "root"],
    queryFn: () => fetchDecks(session?.user?.id!, currentFolderId),
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
      const payload = {
        ...newDeck,
        folderId:
          newDeck.folderId !== undefined
            ? newDeck.folderId
            : (currentFolderId ?? null),
        userId: session?.user?.id,
      };
      const res = await fetch("/api/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create deck");
      return res.json();
    },
    onSuccess: (createdDeck) => {
      queryClient.invalidateQueries({
        queryKey: ["decks", session?.user?.id, currentFolderId ?? "root"],
      });
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
      queryClient.invalidateQueries({
        queryKey: ["favoriteDecks", session?.user?.id],
      });
      window.dispatchEvent(
        new CustomEvent("deck-deleted", { detail: { deckId } }),
      );
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
      folderId,
    }: {
      deckId: string;
      title: string;
      description: string;
      isPublic: boolean;
      folderId: string | null;
    }) => {
      const res = await fetch(`/api/deck/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isPublic, folderId }),
      });
      if (!res.ok) throw new Error("Failed to update deck");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["decks", session?.user?.id, currentFolderId ?? "root"],
      });
      queryClient.invalidateQueries({
        queryKey: ["favoriteDecks", session?.user?.id],
      });
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
    [createDeckMutation],
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
    (
      deckId: string,
      title: string,
      description: string,
      isPublic: boolean,
      folderId: string | null,
    ) => {
      editDeckMutation.mutate({
        deckId,
        title,
        description,
        isPublic,
        folderId,
      });
    },
    [editDeckMutation],
  );

  const handleCreateFolder = useCallback(
    async (name: string) => {
      return new Promise<void>((resolve, reject) => {
        createFolder.mutate(name, {
          onSuccess: () => {
            showToast("Folder created");
            // After creating, stay at root
            setCurrentFolderId(null);
            router.push("/decks");
            resolve();
          },
          onError: (err: any) => {
            const message = err?.message || "Failed to create folder";
            showToast(message, "error");
            reject(new Error(message));
          },
        });
      });
    },
    [createFolder, showToast, router],
  );

  const handleRenameFolder = useCallback(
    (folderId: string, currentName: string) => {
      setFolderToEdit({ id: folderId, name: currentName });
      setIsEditFolderModalOpen(true);
    },
    [],
  );

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      deleteFolder.mutate(folderId, {
        onSuccess: () => showToast("Folder deleted"),
        onError: (err: any) =>
          showToast(err?.message || "Failed to delete folder", "error"),
      });
    },
    [deleteFolder, showToast],
  );

  const showLoadingState = isLoading || isFetching;
  const showFavoritesLoading = isLoadingFavorites || isFetchingFavorites;
  const currentFolderName = currentFolderId
    ? folders.find((f) => f._id === currentFolderId)?.name || "Folder"
    : "All decks";

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

  // Build combined grid items: folders first (only at root), then decks
  const combinedItems = [
    ...(currentFolderId === null
      ? folders.map((folder) => ({ type: "folder" as const, folder }))
      : []),
    ...decks.map((deck) => ({ type: "deck" as const, deck })),
  ];

  const handleFolderNavigate = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    const params = new URLSearchParams();
    if (folderId) {
      params.set("folderId", folderId);
      router.push(`/decks?${params.toString()}`);
    } else {
      router.push(`/decks`);
    }
  };

  const renderWorkspaceTab = () => (
    <div className="space-y-4">
      {showLoadingState || isLoadingFolders ? (
        renderSkeletonGrid()
      ) : error ? (
        <p className="text-center text-red-500 text-sm">
          Error loading your decks: {error.message}
        </p>
      ) : combinedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {combinedItems.map((item, i) => {
            if (item.type === "folder") {
              return (
                <FolderCard
                  key={`folder-${item.folder._id}`}
                  folder={item.folder}
                  isActive={currentFolderId === item.folder._id}
                  onClick={() => handleFolderNavigate(item.folder._id)}
                  deckCount={item.folder.deckCount}
                  onEdit={() =>
                    handleRenameFolder(item.folder._id, item.folder.name)
                  }
                  onDelete={
                    item.folder.deckCount === 0
                      ? () => handleDeleteFolder(item.folder._id)
                      : undefined
                  }
                />
              );
            }

            return (
              <DeckCard
                key={`deck-${item.deck._id}`}
                deck={item.deck}
                index={i}
                onDeleteClick={handleDeleteClick}
                onEditClick={handleEditDeck}
                queryClient={queryClient}
                folders={folders}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">
            {currentFolderId
              ? "No decks in this folder yet."
              : "You don't have any decks or folders yet."}
          </p>
          <Button
            onClick={() =>
              currentFolderId
                ? setIsAddDeckModalOpen(true)
                : setIsCreateChooserOpen(true)
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Create your first item
          </Button>
        </div>
      )}
    </div>
  );

  const renderFavoritesTab = () => (
    <div className="space-y-4">
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
              folders={folders}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">
            You haven't favorited any decks yet.
          </p>
          <Button onClick={() => setIsCreateChooserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first deck
          </Button>
        </div>
      )}
    </div>
  );

  const renderRecentTab = () => (
    <div className="space-y-4">
      <RecentDecks
        onDeleteClick={handleDeleteClick}
        onEditClick={handleEditDeck}
        showMenu
      />
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
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Decks
            </h1>
          </div>
          <div className="gap-2 hidden md:flex">
            <Button
              className="bg-yellow text-foreground border-2 border-foreground"
              onClick={() =>
                currentFolderId
                  ? setIsAddDeckModalOpen(true)
                  : setIsCreateChooserOpen(true)
              }
            >
              <Plus className="h-4 w-4 mr-2 text-foreground" /> Add
            </Button>
          </div>
        </div>
        {currentFolderId && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit px-0 text-muted-foreground"
            onClick={() => handleFolderNavigate(null)}
          >
            ← Back to Decks
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border/50">
        {[
          { key: "workspace" as DeckTab, label: "Workspace" },
          { key: "favorites" as DeckTab, label: "Favorites" },
          { key: "recent" as DeckTab, label: "Recent" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            className="shrink-0 rounded-full px-4"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border-2 border-black dark:border-accent bg-card backdrop-blur-sm shadow-sm p-4 md:p-6">
        <div className="flex flex-col gap-1 mb-4">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground font-sora">
            {activeTab === "workspace" && currentFolderName}
            {activeTab === "favorites" && "Favorites"}
            {activeTab === "recent" && "Recently Accessed"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeTab === "workspace" &&
              (currentFolderId
                ? "Decks inside this folder."
                : "Folders and decks you own.")}
            {activeTab === "favorites" &&
              "Decks you've starred for quick access."}
            {activeTab === "recent" &&
              "Jump back into the decks you opened most recently."}
          </p>
        </div>

        {activeTab === "workspace" && renderWorkspaceTab()}
        {activeTab === "favorites" && renderFavoritesTab()}
        {activeTab === "recent" && renderRecentTab()}
      </div>

      <div className="fixed bottom-6 right-6 md:hidden">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() =>
            currentFolderId
              ? setIsAddDeckModalOpen(true)
              : setIsCreateChooserOpen(true)
          }
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <AddDeckModal
        open={isAddDeckModalOpen}
        onOpenChange={setIsAddDeckModalOpen}
        onAddDeck={handleAddDeck}
        folders={folders}
        defaultFolderId={currentFolderId}
      />

      <AddFolderModal
        open={isAddFolderModalOpen}
        onOpenChange={setIsAddFolderModalOpen}
        onCreate={handleCreateFolder}
      />

      {folderToEdit && (
        <EditFolderModal
          open={isEditFolderModalOpen}
          onOpenChange={setIsEditFolderModalOpen}
          initialName={folderToEdit.name}
          onSubmit={(name) => {
            setFolderToEdit((prev) => (prev ? { ...prev, name } : prev));
            renameFolder.mutate(
              { folderId: folderToEdit.id, name },
              {
                onSuccess: () => {
                  showToast("Folder renamed");
                  setIsEditFolderModalOpen(false);
                  setFolderToEdit(null);
                },
                onError: (err: any) =>
                  showToast(err?.message || "Failed to rename folder", "error"),
              },
            );
          }}
        />
      )}

      <Dialog open={isCreateChooserOpen} onOpenChange={setIsCreateChooserOpen}>
        <DialogContent className="modal-surface sm:max-w-[520px] p-0">
          <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-muted/40 to-transparent px-6 py-5">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
              <Plus className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle className="text-xl">
                Create something new
              </DialogTitle>
              <DialogDescription>
                Pick what to add to your workspace.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="default"
                className="h-full justify-between bg-yellow text-foreground border border-yellow/60 shadow-[0_12px_30px_rgba(255,215,0,0.35)] hover:scale-[1.01] hover:shadow-[0_16px_36px_rgba(255,215,0,0.4)] transition-transform"
                onClick={() => {
                  setIsCreateChooserOpen(false);
                  setIsAddDeckModalOpen(true);
                }}
              >
                <div className="flex flex-col items-start text-left gap-1">
                  <span className="font-semibold">New Deck</span>
                  <span className="text-xs text-foreground/80">
                    Create flashcards fast.
                  </span>
                </div>
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                className="h-full justify-between bg-pink text-foreground border border-pink/60 shadow-[0_12px_30px_rgba(255,182,251,0.35)] hover:scale-[1.01] hover:shadow-[0_16px_36px_rgba(255,182,251,0.45)] transition-transform"
                onClick={() => {
                  setIsCreateChooserOpen(false);
                  setIsAddFolderModalOpen(true);
                }}
              >
                <div className="flex flex-col items-start text-left gap-1">
                  <span className="font-semibold">New Folder</span>
                  <span className="text-xs text-foreground/80">
                    Group decks by topic.
                  </span>
                </div>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              You can always rearrange decks into folders later.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DecksPage;
