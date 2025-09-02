export type JournalEntry = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  imageUrl?: string;
  rating?: number;
  categories?: string[];
  description?: string;
  source?: "remote" | "local";
};

export type EventEntry = JournalEntry;

export type FilterState = {
  text: string;
  category: string;
  minRating?: number;
};
