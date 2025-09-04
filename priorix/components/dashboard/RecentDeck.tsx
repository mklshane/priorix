"use client";

import { useEffect, useState } from "react";
import DeckCard from "@/components/DeckCard";
import { Deck } from "@/types/deck";
import { useSession } from "next-auth/react";

export default function RecentDecks() {
  const [recentDecks, setRecentDecks] = useState<
    (Deck & { lastStudied?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchRecentDecks = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const res = await fetch(
          `/api/user-deck-activity/recent?userId=${session.user.id}&limit=4`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch recent decks: ${res.statusText}`);
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setRecentDecks(data);
        } else {
          throw new Error("Invalid data format received from API");
        }
      } catch (err: any) {
        console.error("Error loading recent decks:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchRecentDecks();
    }
  }, [session?.user?.id]);

  if (loading) {
    return <p className="text-center text-sm">Loading recent decks...</p>;
  }

  if (error) {
    return (
      <p className="text-center text-red-500 text-sm">
        Error loading recent decks: {error}
      </p>
    );
  }

  if (recentDecks.length === 0) {
    return (
      <p className="text-center text-muted-foreground">No recent decks yet.</p>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
      {recentDecks.map((deck, index) => {
        if (!deck || !deck._id) {
          console.warn("Invalid deck data:", deck);
          return null;
        }

        return (
          <DeckCard
            key={deck._id}
            deck={deck}
            index={index}
            
          />
        );
      })}
    </div>
  );
}
