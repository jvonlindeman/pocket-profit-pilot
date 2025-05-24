
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  searchResults?: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    type: string;
    source: string;
    similarity: number;
  }>;
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

export interface QueryContext {
  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
  activeFilters?: string[];
  visibleData?: {
    transactions: number;
    expenses: number;
    income: number;
  };
}
