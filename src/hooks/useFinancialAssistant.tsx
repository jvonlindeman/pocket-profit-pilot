
import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useFinance } from '@/contexts/FinanceContext';
import { useStoredFinancialData } from '@/hooks/useStoredFinancialData';
import { captureUIData, registerInteraction } from '@/utils/uiCapture';
import { ChatMessage } from '@/types/chat';
import { extractInsights } from '@/utils/insightExtraction';
import { generateSuggestedQuestions } from '@/utils/suggestionGenerator';
import { sendMessageToAssistant } from '@/services/financialAssistantService';
import { SemanticSearchResult } from '@/services/semanticSearchService';

// Import the new modular components
import { FinancialAssistantState } from './useFinancialAssistant/types';
import { ConversationMemoryService } from './useFinancialAssistant/conversationMemoryService';
import { UIDataEnhancer } from './useFinancialAssistant/uiDataEnhancer';
import { MessageProcessor } from './useFinancialAssistant/messageProcessor';
import { WELCOME_MESSAGE } from './useFinancialAssistant/constants';

export const useFinancialAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [semanticSearchResults, setSemanticSearchResults] = useState<SemanticSearchResult[]>([]);
  const financeContext = useFinance();
  const { latestSnapshot, getSnapshotForDateRange, formatForGPT } = useStoredFinancialData();
  const [conversationContext, setConversationContext] = useState(
    ConversationMemoryService.resetContext()
  );
  const [dataFetchInProgress, setDataFetchInProgress] = useState<boolean>(false);

  // Effect to monitor for changes in finance context that would require re-analysis
  useEffect(() => {
    // This is used to trigger a data refresh when key financial data changes
    const financialDataVersion = 
      `${financeContext.summary?.totalIncome || 0}-${financeContext.transactions?.length || 0}`;
    
    // We're just tracking changes, not doing anything with the version string itself
  }, [financeContext.summary, financeContext.transactions]);

  // Send a message and get a response from the assistant
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Register this interaction
    registerInteraction('financial-assistant', 'select', { query: content });
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    // Add user message to the chat
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Trigger data fetch if needed
      if (!dataFetchInProgress) {
        setDataFetchInProgress(true);
      }
      
      // Capture current UI data with detailed logging - await the Promise
      console.log('Capturing enhanced UI data for financial assistant...');
      const uiData = await captureUIData(financeContext);
      
      // Get stored data for current date range
      let storedSnapshot = null;
      if (financeContext.dateRange?.startDate && financeContext.dateRange?.endDate) {
        storedSnapshot = getSnapshotForDateRange(
          financeContext.dateRange.startDate,
          financeContext.dateRange.endDate
        );
      }
      
      // Enhance UI data with stored financial data
      const enhancedUIData = UIDataEnhancer.enhance(
        uiData,
        storedSnapshot,
        latestSnapshot,
        formatForGPT
      );
      
      // Update conversation context
      const updatedContext = ConversationMemoryService.updateContext(
        conversationContext,
        content,
        enhancedUIData
      );
      setConversationContext(updatedContext);
      
      // Send the message to the assistant with enhanced data
      const assistantResponse = await sendMessageToAssistant(
        messages,
        userMessage,
        financeContext.dateRange,
        enhancedUIData,
        updatedContext
      );
      
      // Process the assistant's response
      const processedResponse = MessageProcessor.processAssistantResponse(assistantResponse);
      
      // Update semantic search results
      setSemanticSearchResults(processedResponse.searchResults || []);
      
      // Extract and store insights from the assistant's response
      const newInsights = extractInsights(processedResponse.content);
      if (newInsights.length > 0) {
        setConversationContext(prev => 
          ConversationMemoryService.addInsights(prev, newInsights)
        );
      }
      
      // Add the assistant's response to messages
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: processedResponse.content,
          timestamp: new Date(),
          searchResults: processedResponse.searchResults
        },
      ]);
      
    } catch (err) {
      console.error('Error in financial assistant:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error procesando tu solicitud',
        variant: 'destructive',
      });
      
      // Add an error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setDataFetchInProgress(false);
    }
  }, [messages, financeContext, setMessages, conversationContext, dataFetchInProgress, latestSnapshot, getSnapshotForDateRange, formatForGPT]);
  
  // Clear all messages and reset to initial state
  const resetChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setSemanticSearchResults([]);
    setConversationContext(ConversationMemoryService.resetContext()); 
  }, []);

  // Suggest questions based on the current financial context and stored data
  const getSuggestedQuestions = useCallback((): string[] => {
    const baseQuestions = generateSuggestedQuestions(financeContext);
    
    // Add questions based on stored data availability
    const storedDataQuestions = [
      "Compara este mes con datos históricos almacenados",
      "¿Qué patrones encuentras en mis datos guardados?",
      "Analiza las tendencias usando datos almacenados",
      "Busca transacciones similares en datos históricos"
    ];
    
    // Add semantic search specific suggestions
    const semanticQuestions = [
      "Busca transacciones similares a pagos de Netflix",
      "Encuentra gastos relacionados con comida",
      "Muestra compras parecidas a Amazon",
      "Busca pagos similares a servicios públicos"
    ];
    
    return [...baseQuestions, ...storedDataQuestions, ...semanticQuestions];
  }, [financeContext]);

  return {
    messages,
    isLoading,
    sendMessage,
    resetChat,
    conversationContext,
    getSuggestedQuestions,
    semanticSearchResults
  };
};
