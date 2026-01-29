import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { IFlashcard } from "@/types/flashcard";
import { SrsRating } from "@/lib/srs-config";

const fetchDueCards = async (
  deckId: string,
  sessionSize: number,
  userId?: string
): Promise<IFlashcard[]> => {
  const res = await fetch(
    `/api/flashcard/review?deckId=${deckId}&limit=${sessionSize}&userId=${userId || ""}`
  );
  if (!res.ok) throw new Error("Failed to fetch due flashcards");
  return res.json();
};

export const useSrsStudy = (deckId: string, sessionSize: number) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const queryKey: [string, string, number, string | undefined] = [
    "srs-due",
    deckId,
    sessionSize,
    session?.user?.id,
  ];

  const {
    data: dueCards = [],
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery<IFlashcard[], Error, IFlashcard[], [string, string, number, string | undefined]>({
    queryKey,
    queryFn: () => fetchDueCards(deckId, sessionSize, session?.user?.id),
    enabled: !!deckId && !!session?.user?.id && sessionSize > 0,
    placeholderData: (prev) => prev,
    staleTime: 15_000,
    retry: 2,
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      cardId,
      rating,
      responseTimeMs,
    }: {
      cardId: string;
      rating: SrsRating;
      responseTimeMs?: number;
    }) =>
      fetch("/api/flashcard/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, rating, responseTimeMs }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to submit review");
        return res.json();
      }),
    onSuccess: () => {
      // Keep session smooth without per-card toasts; allow manual refetch between rounds.
      queryClient.invalidateQueries({ queryKey, exact: true });
      if (session?.user?.id) {
        queryClient.invalidateQueries({
          queryKey: ["flashcards", deckId, session.user.id],
          exact: true,
        });
      }
    },
  });

  return {
    dueCards,
    isLoading,
    isFetching,
    error: error ? (error as Error).message : null,
    refetchDue: refetch,
    review: reviewMutation.mutateAsync,
    isReviewing: reviewMutation.isPending,
  };
};
