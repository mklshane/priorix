// types/deck.ts
import { IFlashcard } from "./flashcard";

export interface Deck {
  _id: string;
  title: string;
  description?: string; // Made optional to match model
  isPublic: boolean;
  user: string; // Changed from userId to user to match model
  flashcards: string[] | IFlashcard[]; // Can be populated or just IDs
  sharedWith?: string[];
  createdAt: string; // Changed to string since JSON doesn't preserve Date objects
  updatedAt: string;
}

export interface CreateDeckRequest {
  title: string;
  description?: string; // Made optional
  isPublic: boolean;
  // userId will be added server-side from session, not from client
}
