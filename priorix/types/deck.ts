// types/deck.ts
import { IFlashcard } from "./flashcard";

export interface Deck {
  _id: string;
  title: string;
  length: number;
  description?: string;
  isPublic: boolean;
  user: string | { _id: string; name: string };
  flashcards: string[] | IFlashcard[];
  sharedWith?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeckRequest {
  title: string;
  description?: string;
  isPublic: boolean;
  
}
