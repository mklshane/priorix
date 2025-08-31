export interface Deck {
  _id: string;
  title: string;
  description: string;
  isPublic: boolean;
  userId: string; // Changed from userid to userId
  createdAt: Date;
}

export interface CreateDeckRequest {
  title: string;
  description: string;
  isPublic: boolean;
  userId: string;
}
