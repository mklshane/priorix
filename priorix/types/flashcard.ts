export interface IFlashcard {
  _id: string;
  term: string; 
  definition: string; 
  deck: string;
  createdAt?: string;
  updatedAt?: string;
}
