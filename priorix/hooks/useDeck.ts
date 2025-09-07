import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Deck } from "@/types/deck";

const fetchDeck = async (deckId: string, userId: string) => {
  const res = await fetch(`/api/deck?id=${deckId}&userId=${userId}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Deck not found");
    throw new Error("Failed to fetch deck");
  }
  return res.json();
};

export const useDeck = (deckId: string) => {
  const { data: session } = useSession();

  const {
    data: deck,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["deck", deckId, session?.user?.id],
    queryFn: () => fetchDeck(deckId, session?.user?.id!),
    enabled: !!deckId && !!session?.user?.id,
  });

  return { deck, isLoading, error: error?.message || null };
};
