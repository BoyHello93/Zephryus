
export interface Lesson {
  id: string;
  title: string;
  description: string;
  concept: string;
  instructions: string;
  initialCode: string;
  solutionCode: string; // Used for AI reference/hinting
  userCode?: string; // The code the user has written so far
  completed: boolean;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  finalOutcomeDescription: string; // Preview of what will be made
  previewImage?: string; // Generated snapshot of the final project
  modules: Module[];
  lastAccessed?: number;
  createdAt: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or lucide icon name
  awardedAt: number;
}

export type Theme = 'zephyr' | 'sunset' | 'ocean' | 'forest' | 'crimson';

export interface AppSettings {
  showTips: boolean;
  showInsertionHints: boolean;
  theme: Theme;
}

export type ViewState = 'landing' | 'generating' | 'map' | 'workspace' | 'playground';
export type Difficulty = 'novice' | 'beginner' | 'intermediate' | 'advanced';
export type CourseLength = 'short' | 'medium' | 'long';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface CodeFile {
  name: string;
  language: 'html' | 'css' | 'javascript';
  content: string;
}