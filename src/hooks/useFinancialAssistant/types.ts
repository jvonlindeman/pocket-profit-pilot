
import { ChatMessage, ConversationMemory } from '@/types/chat';
import { SemanticSearchResult } from '@/services/semanticSearchService';

export interface FinancialAssistantState {
  messages: ChatMessage[];
  isLoading: boolean;
  semanticSearchResults: SemanticSearchResult[];
  conversationContext: ConversationMemory;
  dataFetchInProgress: boolean;
}

export interface MessageProcessingResult {
  content: string;
  searchResults?: SemanticSearchResult[];
}
