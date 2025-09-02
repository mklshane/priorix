"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useCardPersistence } from "@/hooks/useCardPersistence";
import { IFlashcard } from "@/types/flashcard";
import { useDeck } from "@/hooks/useDeck";
import { useFlashcards } from "@/hooks/useFlashcards";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import LoadingState from "@/components/DeckDetails/LoadingState";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const StudyPage = () => {
  const params = useParams();
  const deckId = params.deckId as string;

  const { currentCardIndex, saveCardIndex } = useCardPersistence(deckId);
  const { deck, isLoading: isDeckLoading } = useDeck(deckId);
  const { flashcards, isLoading: isFlashcardsLoading } = useFlashcards(deckId);

  const [isFlipped, setIsFlipped] = useState(false);
  const [frontContent, setFrontContent] = useState<"term" | "definition">("term");

  const getSavedPreferences = () => {
    if (typeof window === "undefined") return { frontContent: "term" };

    const saved = localStorage.getItem(`studyPrefs-${deckId}`);
    return saved ? JSON.parse(saved) : { frontContent: "term" };
  };

  useEffect(() => {
    const prefs = getSavedPreferences();
    setFrontContent(prefs.frontContent);
  }, [deckId]);

  useEffect(() => {
    if (flashcards.length > 0 && currentCardIndex >= flashcards.length) {
      saveCardIndex(0); // reset to first card if index is out of bounds
    }
  }, [flashcards.length, currentCardIndex, saveCardIndex]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `studyPrefs-${deckId}`,
        JSON.stringify({ frontContent })
      );
    }
  }, [frontContent, deckId]);

  useEffect(() => {
    saveCardIndex(currentCardIndex);
  }, [currentCardIndex, saveCardIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  if (isDeckLoading || isFlashcardsLoading) {
    return <LoadingState />;
  }

  if (!deck || flashcards.length === 0) {
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
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-4 text-center">
        <p className="text-muted-foreground">
          Card {currentCardIndex + 1} of {flashcards.length}
        </p>
      </div>

      <div
        className="mb-8 cursor-pointer transition-all duration-300 relative"
        onClick={handleCardClick}
      >
        <Card
          className={`h-85 flex items-center justify-center relative ${
            isFlipped ? "bg-muted" : ""
          }`}
        >
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
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFrontContentChange("term");
                  }}
                >
                  Show term first
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFrontContentChange("definition");
                  }}
                >
                  Show definition first
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardContent className="p-6 text-center">
            {isFlipped ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-2xl">
                  {frontContent === "term" ? currentCard.definition : currentCard.term}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-2xl">
                  {frontContent === "term" ? currentCard.term : currentCard.definition}
                </p>
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
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>

        <Button onClick={() => setIsFlipped(!isFlipped)} variant="outline">
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
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StudyPage;