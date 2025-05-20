
import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useFinance } from '@/contexts/FinanceContext';
import { captureUIData, registerInteraction } from '@/utils/uiCapture';
import { ChatMessage, ConversationMemory } from '@/types/chat';
import { extractInsights } from '@/utils/insightExtraction';
import { generateSuggestedQuestions } from '@/utils/suggestionGenerator';
import { sendMessageToAssistant } from '@/services/financialAssistantService';

export const useFinancialAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente financiero con acceso completo a tu historial de datos. ¿En qué puedo ayudarte hoy? Puedo analizar tus datos financieros, identificar tendencias a lo largo del tiempo o responder preguntas específicas sobre tus finanzas.',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const financeContext = useFinance();
  const [conversationContext, setConversationContext] = useState<ConversationMemory>({
    lastQuery: {
      timestamp: '',
      visibleComponents: [],
      focusedElement: null
    },
    sharedInsights: [],
    previousQueries: []
  });
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
        // You could add logic here to refresh financial data if needed
      }
      
      // Capture current UI data with detailed logging
      console.log('Capturing enhanced UI data for financial assistant...');
      const uiData = captureUIData(financeContext);
      
      console.log('Enhanced UI data captured:', {
        activeComponents: uiData.activeComponents,
        hasSummary: Boolean(uiData.summary),
        transactionCount: uiData.transactions?.length || 0,
        expenseCount: uiData.collaboratorExpenses?.length || 0,
        insightCount: uiData.transactionInsights?.length || 0
      });
      
      // Track which UI elements were visible for this question
      const updatedContext = {
        ...conversationContext,
        lastQuery: {
          timestamp: new Date().toISOString(),
          visibleComponents: uiData.activeComponents || [],
          focusedElement: uiData.focusedElement
        },
        previousQueries: [
          ...conversationContext.previousQueries,
          {
            query: content,
            timestamp: new Date().toISOString()
          }
        ].slice(-10) // Keep last 10 queries
      };
      
      setConversationContext(updatedContext);
      
      // Send the message to the assistant
      const assistantResponse = await sendMessageToAssistant(
        messages,
        userMessage,
        financeContext.dateRange,
        uiData,
        updatedContext
      );
      
      // Extract and store insights from the assistant's response
      const newInsights = extractInsights(assistantResponse);
      if (newInsights.length > 0) {
        setConversationContext(prev => ({
          ...prev,
          sharedInsights: [...prev.sharedInsights, ...newInsights].slice(-15) // Keep last 15 insights
        }));
      }
      
      // Add the assistant's response to messages
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date(),
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
  }, [messages, financeContext, setMessages, conversationContext, dataFetchInProgress]);
  
  // Clear all messages and reset to initial state
  const resetChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '¡Hola! Soy tu asistente financiero con acceso completo a tu historial de datos. ¿En qué puedo ayudarte hoy? Puedo analizar tus datos financieros, identificar tendencias a lo largo del tiempo o responder preguntas específicas sobre tus finanzas.',
        timestamp: new Date(),
      },
    ]);
    setConversationContext({
      lastQuery: {
        timestamp: '',
        visibleComponents: [],
        focusedElement: null
      },
      sharedInsights: [],
      previousQueries: []
    }); 
  }, []);

  // Suggest questions based on the current financial context and historical data
  const getSuggestedQuestions = useCallback((): string[] => {
    return generateSuggestedQuestions(financeContext);
  }, [financeContext]);

  return {
    messages,
    isLoading,
    sendMessage,
    resetChat,
    conversationContext,
    getSuggestedQuestions
  };
};
