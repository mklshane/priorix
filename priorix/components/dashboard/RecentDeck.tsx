"use client";

import { useEffect, useState } from "react";
import DeckCard from "@/components/DeckCard";
import { Deck } from "@/types/deck";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { FolderClosed } from "lucide-react";

interface RecentDecksProps {
  onDeleteClick?: (deckId: string) => void;
  onEditClick?: (
    deckId: string,
    title: string,
    description: string,
    isPublic: boolean,
    folderId: string | null,
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
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ deckId: string }>;
      if (custom.detail?.deckId) {
        setRecentDecks((prev) =>
          prev.filter((deck) => deck._id !== custom.detail.deckId),
        );
      }
    };
    if (typeof window !== "undefined")
      window.addEventListener("deck-deleted", handler);
    return () => {
      if (typeof window !== "undefined")
        window.removeEventListener("deck-deleted", handler);
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
          `/api/user-deck-activity/recent?userId=${session.user.id}&limit=4`,
        );
        if (!res.ok)
          throw new Error(`Failed to fetch recent decks: ${res.statusText}`);
        const data = await res.json();
        if (Array.isArray(data)) setRecentDecks(data);
        else throw new Error("Invalid data format received from API");
      } catch (err: any) {
        console.error("Error loading recent decks:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (session?.user?.id) fetchRecentDecks();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse bento-card bg-muted/30 h-48 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5"></div>
                <div className="w-6 h-6 rounded-md bg-black/5 dark:bg-white/5"></div>
              </div>
              <div className="h-5 bg-black/5 dark:bg-white/5 w-3/4 rounded mb-2"></div>
              <div className="h-3 bg-black/5 dark:bg-white/5 w-1/2 rounded mb-4"></div>
            </div>
            <div className="flex justify-between items-center mt-auto">
              <div className="h-3 bg-black/5 dark:bg-white/5 w-1/4 rounded"></div>
              <div className="h-3 bg-black/5 dark:bg-white/5 w-1/4 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-destructive font-bold text-sm bg-destructive/10 border-2 border-destructive rounded-2xl p-4">
        {error}
      </p>
    );
  }

  const displayLimit = isMobile ? 2 : 4;
  const displayDecks = recentDecks.slice(0, displayLimit);

  const colors = ["bg-blush", "bg-mint", "bg-sky", "bg-citrus"];

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {displayDecks.map((deck, index) => {
        if (!deck || !deck._id) return null;
        return (
          <DeckCard
            key={deck._id}
            deck={deck}
          />
        );
      })}

      {Array.from({ length: displayLimit - displayDecks.length }).map(
        (_, index) => (
          <div
            key={`placeholder-${index}`}
            className="bento-card bg-transparent border-dashed flex flex-col items-center justify-center text-muted-foreground min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-full border-2 border-border/20 bg-muted/50 flex items-center justify-center mb-3">
              <FolderClosed className="w-5 h-5 opacity-50" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">
              Empty Slot
            </p>
          </div>
        ),
      )}
    </div>
  );
}
