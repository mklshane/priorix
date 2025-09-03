import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Deck } from "@/types/deck";

export const useDeck = (deckId: string) => {
  const { data: session } = useSession();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeck = async () => {
      if (!deckId || !session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

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

  return { deck, isLoading, error };
};
