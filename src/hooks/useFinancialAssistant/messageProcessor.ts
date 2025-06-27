
import { SemanticSearchResult } from '@/services/semanticSearchService';
import { MessageProcessingResult } from './types';

export class MessageProcessor {
  static processAssistantResponse(assistantResponse: any): MessageProcessingResult {
    let searchResults: SemanticSearchResult[] = [];
    let responseContent: string;
    
    // Handle both string and object responses
    if (typeof assistantResponse === 'string') {
      responseContent = assistantResponse;
    } else if (assistantResponse && typeof assistantResponse === 'object') {
      // Extract content and search results from object response
      responseContent = assistantResponse.content;
      searchResults = assistantResponse.searchResults || [];
      
      console.log(`Semantic search returned ${searchResults.length} results`);
    } else {
      // Fallback for unexpected response format
      responseContent = 'Error: Respuesta inválida del asistente';
    }
    
    return {
      content: responseContent,
      searchResults: searchResults.length > 0 ? searchResults : undefined
    };
  }
}
