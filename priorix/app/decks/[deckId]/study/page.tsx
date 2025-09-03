"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useCardPersistence } from "@/hooks/useCardPersistence";
import { IFlashcard } from "@/types/flashcard";
import { useDeck } from "@/hooks/useDeck";
import { useFlashcards } from "@/hooks/useFlashcards";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/useToast";
import EditFlashcardDialog from "@/components/EditFlashcardDialog";

const StudyPage = () => {
  const params = useParams();
  const deckId = params.deckId as string;
  const { showToast, dismissToast } = useToast();

  const { currentCardIndex, saveCardIndex } = useCardPersistence(deckId);
  const { deck, isLoading: isDeckLoading } = useDeck(deckId);
  const {
    flashcards: originalFlashcards,
    isLoading: isFlashcardsLoading,
    updateFlashcard,
    deleteFlashcard,
  } = useFlashcards(deckId);
  const [flashcards, setFlashcards] = useState<IFlashcard[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [frontContent, setFrontContent] = useState<"term" | "definition">(
    "term"
  );
  const [editingFlashcard, setEditingFlashcard] = useState<IFlashcard | null>(
    null
  );

  // Keep track of the current card ID to maintain position after updates
  const currentCardIdRef = useRef<string | null>(null);
  const shuffleOrderRef = useRef<string[]>([]);

  const shuffleArray = (array: IFlashcard[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const renderText = (text: string, isTerm: boolean = false) => {
    return text.split("\n").map((line, index) => (
      <p key={index} className={`text-2xl my-1 ${isTerm ? "font-bold" : ""}`}>
        {line}
      </p>
    ));
  };

  const getSavedPreferences = () => {
    if (typeof window === "undefined")
      return { frontContent: "term", isShuffled: false };

    const saved = localStorage.getItem(`studyPrefs-${deckId}`);
    return saved
      ? JSON.parse(saved)
      : { frontContent: "term", isShuffled: false };
  };

  useEffect(() => {
    const prefs = getSavedPreferences();
    setFrontContent(prefs.frontContent);
    setIsShuffled(prefs.isShuffled || false);
  }, [deckId]);

  useEffect(() => {
    if (originalFlashcards.length > 0) {
      let newFlashcards: IFlashcard[];

      if (isShuffled) {
        // If we have a saved shuffle order and the current card ID, try to maintain order
        if (
          shuffleOrderRef.current.length === originalFlashcards.length &&
          currentCardIdRef.current
        ) {
          // Reconstruct the shuffled array using the saved order
          const orderedCards = shuffleOrderRef.current
            .map((id) => originalFlashcards.find((card) => card._id === id))
            .filter(Boolean) as IFlashcard[];

          // Add any new cards that weren't in the original shuffle
          const existingIds = new Set(shuffleOrderRef.current);
          const newCards = originalFlashcards.filter(
            (card) => !existingIds.has(card._id)
          );

          newFlashcards = [...orderedCards, ...newCards];
        } else {
          // Create new shuffle and save the order
          newFlashcards = shuffleArray(originalFlashcards);
          shuffleOrderRef.current = newFlashcards.map((card) => card._id);
        }
      } else {
        newFlashcards = originalFlashcards;
        shuffleOrderRef.current = [];
      }

      setFlashcards(newFlashcards);

      // If we have a current card ID, find its new position
      if (currentCardIdRef.current) {
        const newIndex = newFlashcards.findIndex(
          (card) => card._id === currentCardIdRef.current
        );
        if (newIndex !== -1 && newIndex !== currentCardIndex) {
          saveCardIndex(newIndex);
        }
      }
    }
  }, [originalFlashcards, isShuffled]);

  // Update current card ID ref whenever the current card changes
  useEffect(() => {
    if (flashcards.length > 0 && flashcards[currentCardIndex]) {
      currentCardIdRef.current = flashcards[currentCardIndex]._id;
    }
  }, [flashcards, currentCardIndex]);

  useEffect(() => {
    if (flashcards.length > 0 && currentCardIndex >= flashcards.length) {
      saveCardIndex(0);
    }
  }, [flashcards.length, currentCardIndex, saveCardIndex]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `studyPrefs-${deckId}`,
        JSON.stringify({ frontContent, isShuffled })
      );
    }
  }, [frontContent, isShuffled, deckId]);

  useEffect(() => {
    saveCardIndex(currentCardIndex);
  }, [currentCardIndex, saveCardIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA");

      if (isInputFocused) {
        return;
      }

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
  }, [isFlipped, currentCardIndex, flashcards.length]);

  const handleNextCard = useCallback(() => {
    if (flashcards.length === 0) return;

    const nextIndex = (currentCardIndex + 1) % flashcards.length;
    saveCardIndex(nextIndex);
    setIsFlipped(false);
  }, [currentCardIndex, flashcards.length, saveCardIndex]);

  const handlePreviousCard = useCallback(() => {
    if (flashcards.length === 0) return;

    const prevIndex =
      (currentCardIndex - 1 + flashcards.length) % flashcards.length;
    saveCardIndex(prevIndex);
    setIsFlipped(false);
  }, [currentCardIndex, flashcards.length, saveCardIndex]);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleFrontContentChange = (content: "term" | "definition") => {
    setFrontContent(content);
    setIsFlipped(false);
  };

  const handleShuffleToggle = () => {
    setIsShuffled(!isShuffled);
    setIsFlipped(false);
    saveCardIndex(0);
    // Clear the shuffle order when toggling
    shuffleOrderRef.current = [];
    currentCardIdRef.current = null;
  };

  const handleEditFlashcard = async (
    id: string,
    term: string,
    definition: string
  ) => {
    showToast("Updating flashcard...", "loading");

    try {
      await updateFlashcard(id, term, definition);
      dismissToast();
      showToast("Flashcard updated successfully!", "success");
      setEditingFlashcard(null);
      // The card position will be maintained by the useEffect above
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update flashcard";
      dismissToast();
      showToast(errorMessage, "error");
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this flashcard? This action cannot be undone."
      )
    ) {
      return;
    }

    showToast("Deleting flashcard...", "loading");

    try {
      await deleteFlashcard(id);
      dismissToast();
      showToast("Flashcard deleted successfully!", "success");

      // Refresh the flashcards list after deletion
      if (flashcards.length === 1) {
        // If it was the last card, go back to deck details
        window.location.href = `/decks/${deckId}`;
      } else {
        // Otherwise, reload to refresh the list
        window.location.reload();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete flashcard";
      dismissToast();
      showToast(errorMessage, "error");
    }
  };

  if (isDeckLoading || isFlashcardsLoading) {
    return <LoadingState />;
  }

  if (!deck || originalFlashcards.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p>No flashcards available to study.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="container mx-auto px-4 max-w-3xl">
      <div className="mb-4 text-center flex justify-between items-center">
        <p className="text-muted-foreground">
          Card {currentCardIndex + 1} of {flashcards.length}
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleShuffleToggle}
                variant={isShuffled ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                <Shuffle />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isShuffled ? "Unshuffle cards" : "Shuffle cards"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div
        className="mb-8 cursor-pointer transition-all duration-300 relative"
        onClick={handleCardClick}
      >
        <Card
          className={`h-135 sm:h-85 border-2 border-primary flex flex-col items-center justify-center relative ${
            isFlipped ? "bg-yellow/50" : "bg-yellow/30"
          }`}
        >
          <div className="absolute top-4 text-muted-foreground text-sm text-center w-full">
            {isFlipped
              ? frontContent === "term"
                ? "Definition"
                : "Term"
              : frontContent === "term"
              ? "Term"
              : "Definition"}
          </div>
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Front:</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFrontContentChange("term");
                  }}
                  className={
                    frontContent === "term"
                      ? "bg-accent text-accent-foreground mb-1"
                      : "mb-1"
                  }
                >
                  Term
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFrontContentChange("definition");
                  }}
                  className={
                    frontContent === "definition"
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  Definition
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFlashcard(currentCard);
                  }}
                  className="flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFlashcard(currentCard._id);
                  }}
                  className="flex items-center text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardContent className="p-6 text-center">
            {isFlipped ? (
              <div className="flex flex-col items-center justify-center h-full">
                {frontContent === "term"
                  ? renderText(currentCard.definition, false)
                  : renderText(currentCard.term, true)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                {frontContent === "term"
                  ? renderText(currentCard.term, true)
                  : renderText(currentCard.definition, false)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button
          onClick={handlePreviousCard}
          variant="outline"
          disabled={flashcards.length <= 1}
          className="border-2 border-black bg-green hover:bg-green/70 min-w-30"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>

        <Button
          onClick={() => setIsFlipped(!isFlipped)}
          variant="outline"
          className="hidden sm:flex bg-pink border-2 border-primary"
        >
          {isFlipped
            ? frontContent === "term"
              ? "Show Term"
              : "Show Definition"
            : frontContent === "term"
            ? "Show Definition"
            : "Show Term"}
        </Button>

        <Button
          onClick={handleNextCard}
          variant="outline"
          disabled={flashcards.length <= 1}
          className="border-2 border-primary bg-green hover:bg-green/70 min-w-30"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
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
