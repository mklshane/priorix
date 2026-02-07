"use client";

import { useEffect, useState } from "react";
import DeckCard from "@/components/DeckCard";
import { Deck } from "@/types/deck";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

interface RecentDecksProps {
  onDeleteClick?: (deckId: string) => void;
  onEditClick?: (
    deckId: string,
    title: string,
    description: string,
    isPublic: boolean,
    folderId: string | null
  ) => void;
  showMenu?: boolean;
}

export default function RecentDecks({
  onDeleteClick,
  onEditClick,
  showMenu = true,
}: RecentDecksProps) {
  const [recentDecks, setRecentDecks] = useState<
    (Deck & { lastStudied?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ deckId: string }>;
      if (custom.detail?.deckId) {
        setRecentDecks((prev) => prev.filter((deck) => deck._id !== custom.detail.deckId));
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("deck-deleted", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deck-deleted", handler);
      }
    };
  }, []);

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
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
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
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-500 text-sm">
        Error loading recent decks: {error}
      </p>
    );
  }

  const displayLimit = isMobile ? 2 : 4;
  const displayDecks = recentDecks.slice(0, displayLimit);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
      {displayDecks.map((deck, index) => {
        if (!deck || !deck._id) {
          console.warn("Invalid deck data:", deck);
          return null;
        }

        return (
          <DeckCard
            key={deck._id}
            deck={deck}
            index={index}
            onDeleteClick={onDeleteClick}
            onEditClick={onEditClick}
            showMenu={showMenu}
            queryClient={queryClient}
          />
        );
      })}

      {Array.from({ length: displayLimit - displayDecks.length }).map((_, index) => (
        <div
          key={`placeholder-${index}`}
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground/50 min-h-[150px]"
        >
          <div className="text-center">
            <div className="text-2xl mb-2"></div>
            <p className="text-sm">No recent deck</p>
          </div>
        </div>
      ))}
    </div>
  );
}
