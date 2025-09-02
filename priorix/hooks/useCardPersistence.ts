import { useState, useEffect } from "react";

export const useCardPersistence = (deckId: string | null) => {
  const getInitialCardIndex = () => {
    if (!deckId) return 0;
    const savedState = localStorage.getItem(`deck-${deckId}-study-state`);
    if (savedState) {
      try {
        const { cardIndex } = JSON.parse(savedState);
        return cardIndex ?? 0;
      } catch (error) {
        console.error("Error parsing saved study state:", error);
        return 0;
      }
    }
    return 0;
  };

  const [currentCardIndex, setCurrentCardIndex] = useState(getInitialCardIndex);

  useEffect(() => {
    if (!deckId) return;

    const savedState = localStorage.getItem(`deck-${deckId}-study-state`);
    if (savedState) {
      try {
        const { cardIndex } = JSON.parse(savedState);
        setCurrentCardIndex(cardIndex ?? 0);
      } catch (error) {
        console.error("Error parsing saved study state:", error);
      }
    }
  }, [deckId]);

  const saveCardIndex = (index: number) => {
    if (!deckId) return;

    setCurrentCardIndex(index);
    try {
      localStorage.setItem(
        `deck-${deckId}-study-state`,
        JSON.stringify({
          cardIndex: index,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error saving study state:", error);
    }
  };

  const clearSavedState = () => {
    if (!deckId) return;
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
