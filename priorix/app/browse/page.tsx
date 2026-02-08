"use client";

import { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Compass, Loader2, Search, TrendingUp, Layers } from "lucide-react";
import DeckCard from "@/components/DeckCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Deck } from "@/types/deck";

const fetchPublicDecks = async (): Promise<Deck[]> => {
  const baseUrl = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.NEXT_PUBLIC_SITE_URL)
      return process.env.NEXT_PUBLIC_SITE_URL;
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

function BrowseContent() {
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
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
      <div className="mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="space-y-2 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow/75 dark:bg-yellow/10 px-4 py-2 text-sm font-semibold text-foreground border-2 border-black dark:border-darkborder">
              <Compass className="h-4 w-4" />
              Community Library
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-sora lg:text-4xl">
              Explore
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Discover and learn from thousands of flashcards created by learners worldwide
            </p>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search flashcards..."
              className="h-12 pl-12 text-base border-2 border-black dark:border-darkborder focus:border-black dark:focus:border-white transition-colors"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-2 border-destructive bg-destructive/5">
            <CardContent className="py-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Compass className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Failed to load decks
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please check your connection and try again
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-destructive hover:bg-destructive/90 text-white font-semibold border-2 border-black dark:border-darkborder"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State - only show on initial load, not refetches */}
        {(isLoading || isFetching) && decks.length === 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="border-2 border-black dark:border-darkborder bg-muted/20 overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-muted animate-pulse rounded-lg w-3/4"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
                    <div className="flex items-center gap-3 pt-4">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-3 bg-muted animate-pulse rounded w-24"></div>
                        <div className="h-3 bg-muted animate-pulse rounded w-16"></div>
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
          <Card className="border-2 border-dashed border-black dark:border-darkborder bg-muted/20">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-yellow/20 dark:bg-yellow/10 flex items-center justify-center mb-6 border-2 border-black dark:border-darkborder">
                <Compass className="h-10 w-10 text-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-sora">No decks found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {search
                  ? `We couldn't find any decks matching "${search}". Try different keywords or clear your search.`
                  : "No public decks are available yet. Be the first to create and share one!"}
              </p>
              {search && (
                <Button 
                  onClick={() => setSearch("")}
                  className="bg-yellow hover:bg-yellow/90 text-black font-bold border-2 border-black dark:border-darkborder"
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Decks Grid */}
        {!isLoading && filteredDecks.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {paginatedDecks.map((deck) => (
                <DeckCard
                  key={deck._id}
                  deck={deck}
                  showMenu={false}
                  className="h-full bg-yellow/10 dark:bg-yellow/5 hover:bg-yellow/20 dark:hover:bg-yellow/10 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                />
              ))}
            </div>

            {/* Pagination */}
            {filteredDecks.length > PAGE_SIZE && (
              <Card className="border-2 border-black dark:border-darkborder bg-card">
                <CardContent className="p-2 px-4">
                  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div className="text-sm text-muted-foreground font-medium">
                      Showing <span className="font-bold text-foreground">{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="font-bold text-foreground">{Math.min(currentPage * PAGE_SIZE, filteredDecks.length)}</span> of <span className="font-bold text-foreground">{filteredDecks.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setPageInUrl(Math.max(1, currentPage - 1))}
                        className="h-10 px-4 border-2 border-black dark:border-darkborder font-semibold"
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {paginationItems.map((item, idx) =>
                          item === "ellipsis" ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-2 text-muted-foreground font-bold"
                            >
                              …
                            </span>
                          ) : (
                            <Button
                              key={item}
                              variant={item === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageClick(item)}
                              className={`h-10 w-10 p-0 font-bold border-2 border-black dark:border-darkborder ${
                                item === currentPage 
                                  ? "bg-yellow hover:bg-yellow/90 text-black" 
                                  : "hover:bg-yellow/20 dark:hover:bg-yellow/10"
                              }`}
                              aria-current={item === currentPage ? "page" : undefined}
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
                        onClick={() => setPageInUrl(Math.min(totalPages, currentPage + 1))}
                        className="h-10 px-4 border-2 border-black dark:border-darkborder font-semibold"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="ml-2 text-sm">Loading browse…</span>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
