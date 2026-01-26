export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface LinkItem {
  id: string;
  url: string;
  originalText: string; // The full message context
  sender: string;
  date: string; // Extracted date string
  timestamp: number; // For sorting
  
  // AI Generated fields
  category: string;
  summary: string;
  title?: string;
  
  comments: Comment[];
}

export interface ParsedMessage {
  sender: string;
  time: string;
  date: string;
  content: string;
}

export enum ViewMode {
  Grid = 'GRID',
  List = 'LIST'
}
