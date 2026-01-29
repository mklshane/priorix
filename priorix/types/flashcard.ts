export interface IFlashcard {
  _id: string;
  term: string; 
  definition: string; 
  deck: string;
  easeFactor?: number;
  intervalDays?: number;
  lastReviewedAt?: string | null;
  nextReviewAt?: string | null;
  reviewCount?: number;
  againCount?: number;
  hardCount?: number;
  goodCount?: number;
  easyCount?: number;
  averageResponseTime?: number;
  currentState?: "new" | "learning" | "review" | "relearning";
  createdAt?: string;
  updatedAt?: string;
}
