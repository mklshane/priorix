"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Compass, Loader2, Search } from "lucide-react";
import DeckCard from "@/components/DeckCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Deck } from "@/types/deck";

const fetchPublicDecks = async (): Promise<Deck[]> => {
  const baseUrl = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  })();

  const res = await fetch(`${baseUrl}/api/deck`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch public decks");
  }
  return res.json();
};

const PAGE_SIZE = 12;

export default function BrowsePage() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    data: decks = [],
    isLoading,
    isFetching,
    error,
  } = useQuery<Deck[]>({
    queryKey: ["public-decks"],
    queryFn: fetchPublicDecks,
    staleTime: 60_000,
  });

  const filteredDecks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const scoped = query
      ? decks.filter((deck) => {
          const title = deck.title.toLowerCase();
          const desc = deck.description?.toLowerCase() || "";
          return title.includes(query) || desc.includes(query);
        })
      : decks;

    return [...scoped].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [decks, search]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredDecks.length / PAGE_SIZE)),
    [filteredDecks.length],
  );

  const currentPage = useMemo(() => {
    const pageParam = searchParams.get("page");
    const parsed = pageParam ? parseInt(pageParam, 10) : 1;
    if (Number.isNaN(parsed) || parsed < 1) return 1;
    return Math.min(parsed, totalPages);
  }, [searchParams, totalPages]);

  const setPageInUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", `${page}`);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPageInUrl(1);
  };

  const handlePageClick = (page: number) => {
    setPageInUrl(page);
  };

  const paginationItems = useMemo(() => {
    // Build a standard pagination list with explicit ellipsis markers
    const pages: number[] = [];
    const push = (n: number) => pages.push(n);

    push(1);
    if (currentPage - 1 > 1) push(currentPage - 1);
    if (currentPage > 1 && currentPage < totalPages) push(currentPage);
    if (currentPage + 1 < totalPages) push(currentPage + 1);
    push(totalPages);

    const unique = Array.from(new Set(pages))
      .filter((n) => n >= 1 && n <= totalPages)
      .sort((a, b) => a - b);

    const withEllipsis: Array<number | "ellipsis"> = [];
    for (let i = 0; i < unique.length; i += 1) {
      const current = unique[i];
      const prev = unique[i - 1];
      if (prev && current - prev > 1) {
        withEllipsis.push("ellipsis");
      }
      withEllipsis.push(current);
    }
    return withEllipsis;
  }, [currentPage, totalPages]);

  const paginatedDecks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredDecks.slice(start, end);
  }, [filteredDecks, currentPage]);

  const totalCards = useMemo(
    () =>
      filteredDecks.reduce(
        (sum, deck) =>
          sum +
          (deck.length ||
            (Array.isArray(deck.flashcards) ? deck.flashcards.length : 0)),
        0,
      ),
    [filteredDecks],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      <div className="mx-auto max-w-6xl ">
        {/* Header Section */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Compass className="h-4 w-4" />
              Community
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              Explore
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Discover and study decks created by learners worldwide
            </p>
          </div>

          
        </div>

        {/* Search Section */}
        <div className="mb-4 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by deck title or description..."
                className="h-11 pl-10 text-base"
              />
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
              <span className="text-sm text-muted-foreground">
                Showing {paginatedDecks.length} of {filteredDecks.length} decks
              </span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive/40 bg-destructive/5">
            <CardContent className="py-6 text-center">
              <p className="font-semibold text-destructive">
                Failed to load decks
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please check your connection and try again
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {(isLoading || isFetching) && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="border animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="flex items-center gap-2 pt-4">
                      <div className="h-8 w-8 rounded-full bg-muted"></div>
                      <div className="space-y-2">
                        <div className="h-2 bg-muted rounded w-16"></div>
                        <div className="h-2 bg-muted rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDecks.length === 0 && !error && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Compass className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No decks found</h3>
              <p className="text-muted-foreground mb-4">
                {search
                  ? "Try a different search term"
                  : "No public decks available yet"}
              </p>
              {search && (
                <Button variant="outline" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Decks Grid */}
        {!isLoading && filteredDecks.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedDecks.map((deck) => (
                <DeckCard
                  key={deck._id}
                  deck={deck}
                  showMenu={false}
                  className="h-full"
                />
              ))}
            </div>

            {/* Pagination */}
            {filteredDecks.length > PAGE_SIZE && (
              <div className="mt-8">
                <div className="flex flex-col items-center justify-between gap-4 rounded-lg border bg-card/60 p-4 sm:flex-row">
                  <div className="text-sm text-muted-foreground">
                    Page <span className="font-semibold">{currentPage}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setPageInUrl(Math.max(1, currentPage - 1))}
                      className="h-9 px-3"
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1 mx-2">
                      {paginationItems.map((item, idx) =>
                        item === "ellipsis" ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-2 text-muted-foreground"
                          >
                            …
                          </span>
                        ) : (
                          <Button
                            key={item}
                            variant={
                              item === currentPage ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageClick(item)}
                            className="h-9 w-9 p-0"
                            aria-current={
                              item === currentPage ? "page" : undefined
                            }
                          >
                            {item}
                          </Button>
                        ),
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setPageInUrl(Math.min(totalPages, currentPage + 1))
                      }
                      className="h-9 px-3"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
