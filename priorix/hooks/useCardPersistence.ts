import { useState, useEffect } from "react";

export const useCardPersistence = (deckId: string | null) => {
  const getInitialCardIndex = () => {
    if (typeof window === "undefined" || !deckId) return 0;

    try {
      const savedState = localStorage.getItem(`deck-${deckId}-study-state`);
      if (savedState) {
        const { cardIndex } = JSON.parse(savedState);
        return Number(cardIndex) || 0; 
      }
      return 0;
    } catch (error) {
      console.error("Error parsing saved study state:", error);
      return 0;
    }
  };

  const [currentCardIndex, setCurrentCardIndex] = useState(
    getInitialCardIndex()
  );

  useEffect(() => {
    if (typeof window === "undefined" || !deckId) return;

    try {
      localStorage.setItem(
        `deck-${deckId}-study-state`,
        JSON.stringify({
          cardIndex: currentCardIndex,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error saving study state:", error);
    }
  }, [deckId, currentCardIndex]);

  useEffect(() => {
    if (typeof window === "undefined" || !deckId) return;

    try {
      const savedState = localStorage.getItem(`deck-${deckId}-study-state`);
      if (savedState) {
        const { cardIndex } = JSON.parse(savedState);
        setCurrentCardIndex(Number(cardIndex) || 0);
      }
    } catch (error) {
      console.error("Error parsing saved study state:", error);
    }
  }, [deckId]);

  
  const saveCardIndex = (index: number) => {
    if (typeof window === "undefined" || !deckId) return;

    setCurrentCardIndex(index);
   
  };

  const clearSavedState = () => {
    if (typeof window === "undefined" || !deckId) return;

    try {
      localStorage.removeItem(`deck-${deckId}-study-state`);
      setCurrentCardIndex(0);
    } catch (error) {
      console.error("Error clearing saved study state:", error);
    }
  };

  return {
    currentCardIndex,
    saveCardIndex,
    clearSavedState,
  };
};
