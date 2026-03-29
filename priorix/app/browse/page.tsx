"use client";

import { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Compass, Loader2, Search, ArrowLeft, ArrowRight } from "lucide-react";
import DeckCard from "@/components/DeckCard";
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

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden px-4">
       {/* Background decorative elements */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-sky/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-lilac/20 rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-border bg-sky/30 shadow-sm text-xs font-bold uppercase tracking-widest text-foreground mb-6">
            <Compass className="h-4 w-4" />
            Community Library
          </div>
          <h1 className="text-5xl md:text-6xl font-editorial tracking-tight mb-4 text-foreground">
            Explore Decks
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-sans max-w-2xl mx-auto">
            Discover and learn from thousands of flashcards created by the Priorix community.
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl transition-all group-hover:bg-primary/30 opacity-50" />
            <div className="relative flex items-center bg-background border-2 border-border rounded-full shadow-bento-sm overflow-hidden p-1 hover:shadow-bento transition-shadow duration-300">
               <div className="pl-5 pr-3 text-muted-foreground">
                 <Search className="h-6 w-6" />
               </div>
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by topic, keyword, or creator..."
                className="flex-1 h-14 border-0 bg-transparent text-lg shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/50 font-medium"
              />
              {search && (
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => handleSearchChange("")}
                   className="h-10 px-4 mr-1 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-muted"
                 >
                   Clear
                 </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="max-w-md mx-auto border-2 border-red-500/50 bg-red-50 dark:bg-red-500/10 shadow-bento-sm rounded-3xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <Compass className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold font-sans text-red-900 dark:text-red-200 mb-2">
                Connection Error
              </h3>
              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-6">
                We couldn't load the community library. Please check your connection.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="h-12 px-8 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold border-2 border-red-800 shadow-sm"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {(isLoading || isFetching) && decks.length === 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Card key={idx} className="border-2 border-border bg-card shadow-bento-sm rounded-[2rem] h-[180px] overflow-hidden">
                <CardContent className="p-5 h-full flex flex-col justify-between">
                  <div>
                     <div className="h-6 bg-muted/60 animate-pulse rounded-lg w-3/4 mb-3" />
                     <div className="space-y-2">
                       <div className="h-3 bg-muted/40 animate-pulse rounded-full w-full" />
                       <div className="h-3 bg-muted/40 animate-pulse rounded-full w-5/6" />
                     </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                     <div className="h-6 w-20 bg-muted/40 animate-pulse rounded-md" />
                     <div className="h-4 w-16 bg-muted/40 animate-pulse rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDecks.length === 0 && !error && (
          <Card className="max-w-lg mx-auto border-2 border-dashed border-border bg-card/50 shadow-none rounded-[3rem]">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-2xl font-bold font-sans mb-3 text-foreground">No matches found</h3>
              <p className="text-base font-medium text-muted-foreground mb-8">
                {search
                  ? `We couldn't find any decks matching "${search}". Try adjusting your keywords.`
                  : "No public decks are available right now. Be the first to share one!"}
              </p>
              {search && (
                <Button 
                  onClick={() => handleSearchChange("")}
                  className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-2 border-border shadow-bento-sm hover:-translate-y-0.5 transition-all"
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Decks Grid */}
        {!isLoading && filteredDecks.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12">
              {paginatedDecks.map((deck, idx) => (
                <DeckCard
                  key={deck._id}
                  deck={deck}
                  showMenu={false}
                  index={idx}
                  className="h-[160px] rounded-[2rem] bg-mint" // Ensures consistent sizing
                />
              ))}
            </div>

            {/* Pagination Container */}
            {filteredDecks.length > PAGE_SIZE && (
              <div className="flex justify-center mt-8">
                <div className="inline-flex items-center gap-2 p-2 rounded-full border-2 border-border bg-card shadow-bento-sm">
                  
                  {/* Prev Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage <= 1}
                    onClick={() => setPageInUrl(Math.max(1, currentPage - 1))}
                    className="h-10 w-10 rounded-full hover:bg-muted"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 px-2 border-x-2 border-border/50">
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
                          variant={item === currentPage ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handlePageClick(item)}
                          className={`h-10 w-10 p-0 rounded-full font-bold text-sm transition-all ${
                            item === currentPage 
                              ? "bg-foreground text-background shadow-md border-2 border-foreground hover:bg-foreground/90" 
                              : "hover:bg-muted border-2 border-transparent"
                          }`}
                          aria-current={item === currentPage ? "page" : undefined}
                        >
                          {item}
                        </Button>
                      ),
                    )}
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPageInUrl(Math.min(totalPages, currentPage + 1))}
                    className="h-10 w-10 rounded-full hover:bg-muted"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                </div>
              </div>
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-bold uppercase tracking-widest">Loading Library</span>
          </div>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}