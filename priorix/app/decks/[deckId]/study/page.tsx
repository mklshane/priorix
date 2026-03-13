"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useCardPersistence } from "@/hooks/useCardPersistence";
import { IFlashcard } from "@/types/flashcard";
import { useDeck } from "@/hooks/useDeck";
import { useFlashcards } from "@/hooks/useFlashcards";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Shuffle,
  Edit,
  Trash2,
} from "lucide-react";
import LoadingState from "@/components/DeckDetails/LoadingState";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/useToast";
import EditFlashcardDialog from "@/components/EditFlashcardDialog";
import { useDeckContext } from "@/contexts/DeckContext";

const StudyPage = () => {
  const params = useParams();
  const deckId = params.deckId as string;
  const { showToast, dismissToast } = useToast();
  const { currentCardIndex, saveCardIndex } = useCardPersistence(deckId);
  const {
    deck,
    isLoading: isDeckLoading,
    isFetching: isDeckFetching,
    error: deckError,
  } = useDeck(deckId);
  const {
    flashcards,
    isLoading: isFlashcardsLoading,
    isFetching: isFlashcardsFetching,
    error: flashcardsError,
    updateFlashcard,
    deleteFlashcard,
  } = useFlashcards(deckId);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [frontContent, setFrontContent] = useState<"term" | "definition">(
    "term"
  );
  const [editingFlashcard, setEditingFlashcard] = useState<IFlashcard | null>(
    null
  );
  const { isOwner, setDeck } = useDeckContext();
  const queryClient = useQueryClient();
  const currentCardIdRef = useRef<string | null>(null);
  const [shuffledOrder, setShuffledOrder] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (deck) {
      setDeck(deck);
    }
  }, [deck, setDeck]);

  const getSavedPreferences = () => {
    if (typeof window === "undefined") {
      return { frontContent: "term" as const, isShuffled: false };
    }
    try {
      const saved = localStorage.getItem(`studyPrefs-${deckId}`);
      if (!saved) {
        return { frontContent: "term" as const, isShuffled: false };
      }
      const prefs = JSON.parse(saved);
      if (
        !prefs ||
        typeof prefs.frontContent !== "string" ||
        !["term", "definition"].includes(prefs.frontContent) ||
        typeof prefs.isShuffled !== "boolean"
      ) {
        return { frontContent: "term" as const, isShuffled: false };
      }
      return {
        frontContent: prefs.frontContent as "term" | "definition",
        isShuffled: prefs.isShuffled,
      };
    } catch (error) {
      console.error("Error parsing study preferences:", error);
      return { frontContent: "term" as const, isShuffled: false };
    }
  };

  const getShuffleOrder = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`shuffleOrder-${deckId}`);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error parsing shuffle order:", error);
      return [];
    }
  };
  const saveShuffleOrder = (order: string[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`shuffleOrder-${deckId}`, JSON.stringify(order));
    } catch (error) {
      console.error("Error saving shuffle order:", error);
    }
  };

  const savePreferences = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        `studyPrefs-${deckId}`,
        JSON.stringify({ frontContent, isShuffled })
      );
    } catch (error) {
      console.error("Error saving study preferences:", error);
      showToast("Failed to save preferences", "error");
    }
  };

  const shuffleArray = (array: IFlashcard[]): string[] => {
    const ids = [...array.map((card) => card._id)];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  };

  useEffect(() => {
    if (flashcards.length > 0 && !isInitialized) {
      const prefs = getSavedPreferences();
      setFrontContent(prefs.frontContent);
      setIsShuffled(prefs.isShuffled);

      if (prefs.isShuffled) {
        const savedOrder = getShuffleOrder();
        if (
          savedOrder.length === flashcards.length &&
          savedOrder.every((id) => flashcards.some((card) => card._id === id))
        ) {
          setShuffledOrder(savedOrder);
        } else {
          const newOrder = shuffleArray(flashcards);
          setShuffledOrder(newOrder);
          saveShuffleOrder(newOrder);
        }
      }

      setIsInitialized(true);
    }
  }, [flashcards, deckId, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      savePreferences();
    }
  }, [frontContent, isShuffled, isInitialized]);

  // Save shuffle order when it changes
  useEffect(() => {
    if (isInitialized && isShuffled && shuffledOrder.length > 0) {
      saveShuffleOrder(shuffledOrder);
    }
  }, [shuffledOrder, isShuffled, isInitialized]);

  const orderedFlashcards =
    isShuffled && shuffledOrder.length > 0
      ? (shuffledOrder
          .map((id) => flashcards.find((card) => card._id === id))
          .filter(Boolean) as IFlashcard[])
      : flashcards;

  useEffect(() => {
    if (orderedFlashcards.length > 0 && orderedFlashcards[currentCardIndex]) {
      currentCardIdRef.current = orderedFlashcards[currentCardIndex]._id;
    } else if (
      orderedFlashcards.length > 0 &&
      currentCardIndex >= orderedFlashcards.length
    ) {
      saveCardIndex(0);
      currentCardIdRef.current = orderedFlashcards[0]._id;
    }
  }, [orderedFlashcards, currentCardIndex, saveCardIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA");
      if (isInputFocused) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped(!isFlipped);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePreviousCard();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNextCard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, currentCardIndex, orderedFlashcards.length]);

  const handleNextCard = useCallback(() => {
    if (orderedFlashcards.length === 0) return;
    const nextIndex = (currentCardIndex + 1) % orderedFlashcards.length;
    saveCardIndex(nextIndex);
    setIsFlipped(false);
  }, [currentCardIndex, orderedFlashcards.length, saveCardIndex]);

  const handlePreviousCard = useCallback(() => {
    if (orderedFlashcards.length === 0) return;
    const prevIndex =
      (currentCardIndex - 1 + orderedFlashcards.length) %
      orderedFlashcards.length;
    saveCardIndex(prevIndex);
    setIsFlipped(false);
  }, [currentCardIndex, orderedFlashcards.length, saveCardIndex]);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleFrontContentChange = (content: "term" | "definition") => {
    setFrontContent(content);
    setIsFlipped(false);
  };

  const handleShuffleToggle = () => {
    const newIsShuffled = !isShuffled;
    setIsShuffled(newIsShuffled);
    setIsFlipped(false);

    if (newIsShuffled) {
      const newOrder = shuffleArray(flashcards);
      setShuffledOrder(newOrder);
      saveShuffleOrder(newOrder);
    } else {
      setShuffledOrder([]);
      try {
        localStorage.removeItem(`shuffleOrder-${deckId}`);
      } catch (error) {
        console.error("Error removing shuffle order:", error);
      }
    }

    saveCardIndex(0);
    currentCardIdRef.current = null;
  };

  const handleEditFlashcard = async (
    id: string,
    term: string,
    definition: string
  ) => {
    if (!isOwner) {
      showToast("Only deck owners can edit cards", "error");
      return;
    }
    try {
      await updateFlashcard({ id, term, definition });
      setEditingFlashcard(null);
      dismissToast();
      showToast("Flashcard updated successfully!", "success");
    } catch (err) {
      console.error("Error updating flashcard:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update flashcard";
      dismissToast();
      showToast(errorMessage, "error");
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    if (!isOwner) {
      showToast("Only deck owners can delete cards", "error");
      return;
    }
    if (
      !confirm(
        "Are you sure you want to delete this flashcard? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await deleteFlashcard(id);
      dismissToast();
      showToast("Flashcard deleted successfully!", "success");

      if (isShuffled) {
        // Update the shuffled order by removing the deleted card
        const updatedShuffleOrder = shuffledOrder.filter(
          (cardId) => cardId !== id
        );
        setShuffledOrder(updatedShuffleOrder);
        saveShuffleOrder(updatedShuffleOrder);
      }

      if (orderedFlashcards.length === 1) {
        window.location.href = `/decks/${deckId}`;
      } else {
        saveCardIndex(0);
        currentCardIdRef.current = null;
      }
    } catch (err) {
      console.error("Error deleting flashcard:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete flashcard";
      dismissToast();
      showToast(errorMessage, "error");
    }
  };

  const renderText = (text: string, isTerm: boolean = false) => {
    return text.split("\n").map((line, index) => (
      <p
        key={index}
        className={`my-1 tracking-tight ${isTerm ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"}`}
      >
        {line}
      </p>
    ));
  };

  // Only show loading on initial load, not on refetches
  // If we have data or are initialized, don't show loading
  const isPending =
    ((isDeckLoading || isDeckFetching) && !deck) ||
    ((isFlashcardsLoading || isFlashcardsFetching) && flashcards.length === 0) ||
    !isInitialized;

  if (isPending) {
    return <LoadingState />;
  }

  if (!isPending && ((deckError && !deck) || (flashcardsError && flashcards.length === 0))) {
    const errorMessage = deckError || flashcardsError || "Failed to load data";
    return (
      <div className="min-h-screen p-4 md:p-6 px-2 max-w-3xl mx-auto">
        <div className="bento-card text-center p-8">
          <p className="text-lg font-bold">{errorMessage}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-6 rounded-full border-2 border-border"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <div className="bento-card text-center p-8">
          <p className="text-lg font-bold">Deck not found.</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <div className="bento-card text-center p-8">
          <p className="text-lg font-bold">No flashcards available to study.</p>
        </div>
      </div>
    );
  }

  const currentCard = orderedFlashcards[currentCardIndex];

  return (
    <div className="mx-auto w-full max-w-4xl h-[100dvh] md:h-[calc(100dvh-5rem)] flex flex-col py-4 md:py-8 px-4">
      <div className="mb-6 text-center flex justify-between items-center px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-border bg-lilac shadow-bento-sm text-sm font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-border" />
          Card {currentCardIndex + 1} of {orderedFlashcards.length}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleShuffleToggle}
                className={`rounded-full border-2 border-border h-10 w-10 p-0 transition-all ${isShuffled ? 'bg-primary text-primary-foreground shadow-bento-sm' : 'bg-background hover:bg-muted text-foreground hover:-translate-y-1 hover:shadow-bento-sm'}`}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isShuffled ? "Unshuffle cards" : "Shuffle cards"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div
        className="flex-1 min-h-0 cursor-pointer group perspective-1000 w-full mb-6 relative"
        onClick={handleCardClick}
      >
        <div
          className={`absolute inset-0 bento-card shadow-none border-border bg-card p-8 md:p-12 overflow-y-auto flex flex-col items-center justify-center transition-all duration-500 ease-out `}
        >
          <div className="absolute top-6 text-muted-foreground text-xs uppercase tracking-widest font-bold w-full text-center opacity-60">
            {isFlipped
              ? frontContent === "term"
                ? "Definition"
                : "Term"
              : frontContent === "term"
              ? "Term"
              : "Definition"}
          </div>
          <div className="absolute top-4 right-4 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-muted/80 text-foreground/70 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl border-2 border-border p-2">
                <DropdownMenuLabel className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Front Content</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFrontContentChange("term");
                  }}
                  className={`rounded-xl font-medium cursor-pointer ${
                    frontContent === "term" ? "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground mb-1" : "mb-1 focus:bg-muted"
                  }`}
                >
                  Term
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFrontContentChange("definition");
                  }}
                  className={`rounded-xl font-medium cursor-pointer ${
                    frontContent === "definition" ? "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground" : "focus:bg-muted"
                  }`}
                >
                  Definition
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuSeparator className="bg-border/20 my-2" />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFlashcard(currentCard);
                      }}
                      className="flex items-center rounded-xl cursor-pointer font-medium focus:bg-lilac"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Card
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFlashcard(currentCard._id);
                      }}
                      className="flex items-center text-red-600 focus:text-red-600 focus:bg-red-50 rounded-xl cursor-pointer font-medium mt-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Card
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="text-center w-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            {isFlipped ? (
              <div className="flex flex-col items-center justify-center text-foreground">
                {frontContent === "term"
                  ? renderText(currentCard.definition, false)
                  : renderText(currentCard.term, true)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-foreground">
                {frontContent === "term"
                  ? renderText(currentCard.term, true)
                  : renderText(currentCard.definition, false)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 px-4">
        <Button
          onClick={handlePreviousCard}
          disabled={orderedFlashcards.length <= 1}
          className="flex-1 max-w-[200px] h-14 rounded-full border-2 border-border bg-background text-foreground font-bold text-lg hover:-translate-y-1 hover:shadow-bento transition-all duration-300 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Prev
        </Button>
        <Button
          onClick={() => setIsFlipped(!isFlipped)}
          className="hidden sm:flex flex-1 max-w-[200px] h-14 rounded-full border-2 border-border bg-mint text-foreground font-bold text-lg hover:-translate-y-1 hover:shadow-bento transition-all duration-300 active:translate-y-0 active:shadow-none"
        >
          Flip Card
        </Button>
        <Button
          onClick={handleNextCard}
          disabled={orderedFlashcards.length <= 1}
          className="flex-1 max-w-[200px] h-14 rounded-full border-2 border-border bg-primary text-primary-foreground font-bold text-lg hover:-translate-y-1 hover:shadow-bento transition-all duration-300 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          Next <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {editingFlashcard && (
        <EditFlashcardDialog
          open={!!editingFlashcard}
          onOpenChange={(open) => !open && setEditingFlashcard(null)}
          flashcard={editingFlashcard}
          onSave={handleEditFlashcard}
        />
      )}
    </div>
  );
};

export default StudyPage;




