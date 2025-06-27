
import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useFinance } from '@/contexts/FinanceContext';
import { useStoredFinancialData } from '@/hooks/useStoredFinancialData';
import { captureUIData, registerInteraction } from '@/utils/uiCapture';
import { ChatMessage, ConversationMemory } from '@/types/chat';
import { extractInsights } from '@/utils/insightExtraction';
import { generateSuggestedQuestions } from '@/utils/suggestionGenerator';
import { sendMessageToAssistant } from '@/services/financialAssistantService';
import { SemanticSearchResult } from '@/services/semanticSearchService';

export const useFinancialAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente financiero con acceso completo a tu historial de datos almacenados localmente y capacidades de búsqueda semántica avanzada. Puedo ayudarte a:\n\n• Analizar tus finanzas usando datos guardados localmente\n• Buscar transacciones específicas por descripción\n• Comparar períodos usando datos históricos almacenados\n• Responder preguntas sobre tu historial financiero completo\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [semanticSearchResults, setSemanticSearchResults] = useState<SemanticSearchResult[]>([]);
  const financeContext = useFinance();
  const { latestSnapshot, getSnapshotForDateRange, formatForGPT } = useStoredFinancialData();
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
      }
      
      // Capture current UI data with detailed logging - await the Promise
      console.log('Capturing enhanced UI data for financial assistant...');
      const uiData = await captureUIData(financeContext);
      
      // Create enhanced UI data with stored financial data
      let enhancedUIData: any = { ...uiData };
      
      // Try to get stored data for current date range first
      if (financeContext.dateRange?.startDate && financeContext.dateRange?.endDate) {
        const storedSnapshot = getSnapshotForDateRange(
          financeContext.dateRange.startDate,
          financeContext.dateRange.endDate
        );
        
        if (storedSnapshot) {
          console.log('📁 Using stored financial data for current date range');
          enhancedUIData.storedFinancialData = formatForGPT(storedSnapshot);
          enhancedUIData.dataSource = 'stored_snapshot';
        }
      }
      
      // If no specific snapshot found, use latest available
      if (!enhancedUIData.storedFinancialData && latestSnapshot) {
        console.log('📁 Using latest stored financial data snapshot');
        enhancedUIData.storedFinancialData = formatForGPT(latestSnapshot);
        enhancedUIData.dataSource = 'latest_snapshot';
      }
      
      console.log('Enhanced UI data with stored financial data:', {
        activeComponents: enhancedUIData.activeComponents,
        hasSummary: Boolean(enhancedUIData.summary),
        transactionCount: enhancedUIData.transactions?.length || 0,
        hasStoredData: Boolean(enhancedUIData.storedFinancialData),
        dataSource: enhancedUIData.dataSource,
      });
      
      // Track which UI elements were visible for this question
      const updatedContext = {
        ...conversationContext,
        lastQuery: {
          timestamp: new Date().toISOString(),
          visibleComponents: enhancedUIData.activeComponents || [],
          focusedElement: enhancedUIData.focusedElement
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
      
      // Send the message to the assistant with enhanced data
      const assistantResponse = await sendMessageToAssistant(
        messages,
        userMessage,
        financeContext.dateRange,
        enhancedUIData,
        updatedContext
      );
      
      // Check if semantic search results were returned and extract content properly
      let searchResults: SemanticSearchResult[] = [];
      let responseContent: string;
      
      // Handle both string and object responses
      if (typeof assistantResponse === 'string') {
        responseContent = assistantResponse;
        setSemanticSearchResults([]);
      } else if (assistantResponse && typeof assistantResponse === 'object') {
        // Extract content and search results from object response
        responseContent = assistantResponse.content;
        searchResults = assistantResponse.searchResults || [];
        setSemanticSearchResults(searchResults);
        
        console.log(`Semantic search returned ${searchResults.length} results`);
      } else {
        // Fallback for unexpected response format
        responseContent = 'Error: Respuesta inválida del asistente';
        setSemanticSearchResults([]);
      }
      
      // Extract and store insights from the assistant's response
      const newInsights = extractInsights(responseContent);
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
          content: responseContent,
          timestamp: new Date(),
          searchResults: searchResults.length > 0 ? searchResults : undefined
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
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '¡Hola! Soy tu asistente financiero con acceso completo a tu historial de datos almacenados localmente y capacidades de búsqueda semántica avanzada. Puedo ayudarte a:\n\n• Analizar tus finanzas usando datos guardados localmente\n• Buscar transacciones específicas por descripción\n• Comparar períodos usando datos históricos almacenados\n• Responder preguntas sobre tu historial financiero completo\n\n¿En qué puedo ayudarte hoy?',
        timestamp: new Date(),
      },
    ]);
    setSemanticSearchResults([]);
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
