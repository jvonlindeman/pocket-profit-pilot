
import { ConversationMemory } from '@/types/chat';

export class ConversationMemoryService {
  static updateContext(
    currentContext: ConversationMemory,
    query: string,
    uiData: any
  ): ConversationMemory {
    return {
      ...currentContext,
      lastQuery: {
        timestamp: new Date().toISOString(),
        visibleComponents: uiData.activeComponents || [],
        focusedElement: uiData.focusedElement
      },
      previousQueries: [
        ...currentContext.previousQueries,
        {
          query,
          timestamp: new Date().toISOString()
        }
      ].slice(-10) // Keep last 10 queries
    };
  }

  static resetContext(): ConversationMemory {
    return {
      lastQuery: {
        timestamp: '',
        visibleComponents: [],
        focusedElement: null
      },
      sharedInsights: [],
      previousQueries: []
    };
  }

  static addInsights(context: ConversationMemory, insights: string[]): ConversationMemory {
    if (insights.length === 0) return context;
    
    return {
      ...context,
      sharedInsights: [...context.sharedInsights, ...insights].slice(-15) // Keep last 15 insights
    };
  }
}
