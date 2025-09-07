import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import { IFlashcard } from "@/types/flashcard";

const fetchFlashcards = async (
  deckId: string,
  userId: string
): Promise<IFlashcard[]> => {
  const res = await fetch(`/api/flashcard?deckId=${deckId}&userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch flashcards");
  return res.json();
};

export const useFlashcards = (deckId: string) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { showToast, dismissToast } = useToast();

  const {
    data: flashcards = [],
    isLoading,
    error,
  } = useQuery<IFlashcard[]>({
    queryKey: ["flashcards", deckId, session?.user?.id],
    queryFn: () => fetchFlashcards(deckId, session?.user?.id!),
    enabled: !!deckId && !!session?.user?.id,
  });

  const addFlashcard = useMutation({
    mutationFn: ({ term, definition }: { term: string; definition: string }) =>
      fetch("/api/flashcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: term.trim(),
          definition: definition.trim(),
          deck: deckId,
          userId: session?.user?.id,
        }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create flashcard");
        return res.json();
      }),
    onMutate: () => showToast("Creating flashcard...", "loading"),
    onSuccess: (newFlashcard: IFlashcard) => {
      queryClient.setQueryData<IFlashcard[]>(
        ["flashcards", deckId, session?.user?.id],
        (old = []) => [...old, newFlashcard]
      );
      dismissToast();
      showToast("Flashcard created successfully!", "success");
    },
    onError: (err) => {
      dismissToast();
      showToast(
        err instanceof Error ? err.message : "Failed to create flashcard",
        "error"
      );
    },
  });

  const updateFlashcard = useMutation({
    mutationFn: ({
      id,
      term,
      definition,
    }: {
      id: string;
      term: string;
      definition: string;
    }) =>
      fetch("/api/flashcard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, term, definition }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update flashcard");
        return res.json();
      }),
    onMutate: () => showToast("Updating flashcard...", "loading"),
    onSuccess: (updatedFlashcard: IFlashcard) => {
      queryClient.setQueryData<IFlashcard[]>(
        ["flashcards", deckId, session?.user?.id],
        (old = []) =>
          old.map((fc) =>
            fc._id === updatedFlashcard._id ? updatedFlashcard : fc
          )
      );
      dismissToast();
      showToast("Flashcard updated successfully!", "success");
    },
    onError: (err) => {
      dismissToast();
      showToast(
        err instanceof Error ? err.message : "Failed to update flashcard",
        "error"
      );
    },
  });

  const deleteFlashcard = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/flashcard?id=${id}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete flashcard");
        return res;
      }),
    onMutate: (id) => {
      showToast("Deleting flashcard...", "loading");
      return { id }; // Pass id to onSuccess via context
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<IFlashcard[]>(
        ["flashcards", deckId, session?.user?.id],
        (old = []) => old.filter((fc) => fc._id !== id)
      );
      dismissToast();
      showToast("Flashcard deleted successfully!", "success");
    },
    onError: (err) => {
      dismissToast();
      showToast(
        err instanceof Error ? err.message : "Failed to delete flashcard",
        "error"
      );
    },
  });

  const addMultipleFlashcards = useMutation({
    mutationFn: (
      flashcards: Omit<IFlashcard, "_id" | "createdAt" | "updatedAt">[]
    ) =>
      Promise.all(
        flashcards.map((flashcard) =>
          fetch("/api/flashcard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              term: flashcard.term.trim(),
              definition: flashcard.definition.trim(),
              deck: deckId,
              userId: session?.user?.id,
            }),
          }).then((res) => {
            if (!res.ok)
              throw new Error(`Failed to add flashcard: ${flashcard.term}`);
            return res.json();
          })
        )
      ),
    onMutate: () => showToast("Importing flashcards...", "loading"),
    onSuccess: (newFlashcards: IFlashcard[]) => {
      queryClient.setQueryData<IFlashcard[]>(
        ["flashcards", deckId, session?.user?.id],
        (old = []) => [...old, ...newFlashcards]
      );
      dismissToast();
      showToast("Flashcards imported successfully!", "success");
    },
    onError: (err) => {
      dismissToast();
      showToast(
        err instanceof Error ? err.message : "Failed to import flashcards",
        "error"
      );
    },
  });

  return {
    flashcards,
    isLoading,
    error: error?.message || null,
    addFlashcard: addFlashcard.mutateAsync,
    updateFlashcard: updateFlashcard.mutateAsync,
    deleteFlashcard: deleteFlashcard.mutateAsync,
    addMultipleFlashcards: addMultipleFlashcards.mutateAsync,
  };
};
