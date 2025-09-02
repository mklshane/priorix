// types/deck.ts
import { IFlashcard } from "./flashcard";

export interface Deck {
  _id: string;
  title: string;
  length: number;
  description?: string; 
  isPublic: boolean;
  user: string; // Changed from userId to user to match model
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
