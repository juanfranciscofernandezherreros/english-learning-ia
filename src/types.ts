/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Topic {
  id: number;
  title: string;
  summary: string;
  content: string;
  examples: string[];
}

export type QuestionType = "multiple-choice" | "fill-blank" | "transformation";

export interface QuizQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface UserProgressRes {
  topicId: number;
  score: number; // percentage
  completedAt: string;
}

export interface UserState {
  completedTopics: number[]; // topic IDs
  scores: Record<number, number>; // topicId -> max score
  streak: number;
  lastActive: string; // ISO string
}
