// types/deck.ts
import { IFlashcard } from "./flashcard";

export interface Folder {
  _id: string;
  name: string;
  user: string;
  createdAt: string;
  updatedAt: string;
  deckCount?: number;
}

export interface Deck {
  _id: string;
  title: string;
  length: number;
  description?: string;
  isPublic: boolean;
  user: string | { _id: string; name: string };
  folder?: string | Folder | null;
  flashcards: string[] | IFlashcard[];
  sharedWith?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeckRequest {
  title: string;
  description?: string;
  isPublic: boolean;
  folderId?: string | null;
}
