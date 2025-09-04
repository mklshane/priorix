// contexts/DeckContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { Deck } from "@/types/deck";

interface DeckContextType {
  isOwner: boolean;
  setIsOwner: (isOwner: boolean) => void;
  deck: Deck | null;
  setDeck: (deck: Deck) => void;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

export const useDeckContext = () => {
  const context = useContext(DeckContext);
  if (context === undefined) {
    throw new Error("useDeckContext must be used within a DeckProvider");
  }
  return context;
};

interface DeckProviderProps {
  children: ReactNode;
}

export const DeckProvider: React.FC<DeckProviderProps> = ({ children }) => {
  const [isOwner, setIsOwner] = useState(false);
  const [deck, setDeckState] = useState<Deck | null>(null);
  const { data: session } = useSession();

  const setDeck = (newDeck: Deck) => {
    setDeckState(newDeck);

    // Use your exact ownership logic
    const calculatedIsOwner = Boolean(
      session?.user?.id === newDeck.user ||
        (newDeck.user &&
          typeof newDeck.user === "object" &&
          newDeck.user._id === session?.user?.id)
    );

    setIsOwner(calculatedIsOwner);
  };

  const contextValue: DeckContextType = {
    isOwner,
    setIsOwner,
    deck,
    setDeck,
  };

  return (
    <DeckContext.Provider value={contextValue}>{children}</DeckContext.Provider>
  );
};
