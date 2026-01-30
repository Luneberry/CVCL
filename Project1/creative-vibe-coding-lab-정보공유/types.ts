export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface LinkItem {
  id:string;
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

export interface Journal {
  id: number;
  session_id: number;
  title: string | null;
  content: string | null;
  raw_content: string | null;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  author: string;
  url: string;
  description?: string;
  created_at: string;
}

export enum ViewMode {
  Grid = 'GRID',
  List = 'LIST'
}
