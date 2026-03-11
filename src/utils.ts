import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Plan = 'free' | 'premium';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  isAdmin: boolean;
  createdAt: number;
}

export interface Usage {
  chats: number;
  images: number;
  analysis: number;
  lastReset: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  userId: string;
}

export const LIMITS = {
  free: {
    chats: 5,
    images: 2,
    analysis: 1,
  },
  premium: {
    chats: Infinity,
    images: Infinity,
    analysis: Infinity,
  }
};
