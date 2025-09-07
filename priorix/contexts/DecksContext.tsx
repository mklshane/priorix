// context/DecksContext.tsx (correct path - singular)
"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Deck } from "@/types/deck";

interface DecksContextType {
  decks: Deck[];
  setDecks: (decks: Deck[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  fetchDecks: () => Promise<void>; // Add fetch function to context
}

const DecksContext = createContext<DecksContextType | undefined>(undefined);

export const DecksProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [decks, setDecks] = React.useState<Deck[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchDecks = async () => {
    // You'll need to pass userId or get session in the fetch function
    // This should be implemented where you have access to session
  };

  return (
    <DecksContext.Provider
      value={{
        decks,
        setDecks,
        isLoading,
        setIsLoading,
        fetchDecks,
      }}
    >
      {children}
    </DecksContext.Provider>
  );
};

export const useDecks = () => {
  const context = useContext(DecksContext);
  if (context === undefined) {
    throw new Error("useDecks must be used within a DecksProvider");
  }
  return context;
};
