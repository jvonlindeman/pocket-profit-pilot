
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ConversationMemory {
  lastQuery: {
    timestamp: string;
    visibleComponents: string[];
    focusedElement: string | null;
  };
  sharedInsights: string[];
  previousQueries: Array<{
    query: string;
    timestamp: string;
  }>;
}
