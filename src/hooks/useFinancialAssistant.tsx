
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useFinance } from '@/contexts/FinanceContext';
import { 
  captureUIData, 
  optimizeUIData, 
  registerInteraction 
} from '@/utils/uiCapture';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ConversationMemory {
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

  // Helper to extract key insights from assistant responses
  const extractInsights = useCallback((content: string): string[] => {
    const insights: string[] = [];
    
    // Split content into paragraphs
    const paragraphs = content.split('\n\n');
    
    // Look for insights in paragraphs that contain numbers, percentages, or financial terms
    paragraphs.forEach(paragraph => {
      if (
        (paragraph.includes('$') || paragraph.includes('%') || 
         paragraph.includes('USD') || paragraph.includes('euros')) && 
        (paragraph.includes('aument') || paragraph.includes('disminu') || 
         paragraph.includes('tendencia') || paragraph.includes('comparaci') || 
         paragraph.includes('históric') || paragraph.includes('análisis') ||
         paragraph.includes('crecimiento') || paragraph.includes('reducción') ||
         paragraph.includes('estacional') || paragraph.includes('trimestre') ||
         paragraph.includes('margen'))
      ) {
        insights.push(paragraph.trim());
      }
    });
    
    return insights;
  }, []);

  // Effect to monitor for changes in finance context that would require re-analysis
  useEffect(() => {
    // This is used to trigger a data refresh when key financial data changes
    const financialDataVersion = financeContext.financialData 
      ? `${financeContext.financialData.summary?.totalIncome || 0}-${financeContext.financialData.transactions?.length || 0}`
      : 'no-data';
    
    // We're just tracking changes, not doing anything with the version string itself
  }, [financeContext.financialData]);

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
      const optimizedUIData = optimizeUIData(uiData);
      
      console.log('Enhanced UI data captured:', {
        activeComponents: uiData.activeComponents,
        hasSummary: Boolean(uiData.summary),
        transactionCount: uiData.transactions?.length || 0,
        expenseCount: uiData.collaboratorExpenses?.length || 0,
        insightCount: uiData.transactionInsights?.length || 0
      });
      
      // Prepare messages for the API (exclude 'system' messages)
      const apiMessages = messages
        .filter(msg => msg.role !== 'system')
        .concat(userMessage)
        .map(({ role, content }) => ({ role, content }));
      
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
      
      console.log('Sending request to financial-assistant edge function with enhanced data...');
      
      // Call the financial-assistant edge function with enhanced UI data
      const { data, error } = await supabase.functions.invoke('financial-assistant', {
        body: {
          messages: apiMessages,
          dateRange: {
            startDate: financeContext.dateRange.startDate?.toISOString() || null,
            endDate: financeContext.dateRange.endDate?.toISOString() || null,
          },
          uiData: optimizedUIData, // Send the optimized UI data to the edge function
          conversationContext: updatedContext // Send additional context about the conversation
        },
      });
      
      if (error) {
        console.error('Error calling financial assistant:', error);
        throw new Error(error.message || 'Error comunicando con asistente IA');
      }
      
      console.log('Received response from financial-assistant edge function');
      
      if (!data || !data.response || !data.response.content) {
        throw new Error('Respuesta vacía del asistente financiero');
      }
      
      const assistantResponse = data.response.content;
      
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
  }, [messages, financeContext, setMessages, conversationContext, extractInsights, dataFetchInProgress]);
  
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
    // Basic suggestions always available
    const basicQuestions = [
      "¿Cómo están mis finanzas este mes comparado con el mes anterior?",
      "¿Cuáles son mis mayores gastos por categoría?",
      "¿Cómo ha evolucionado mi margen de beneficio en el último año?"
    ];
    
    // Context-aware suggestions
    const contextQuestions: string[] = [];
    
    // Profit margin suggestions
    if (financeContext.financialData && financeContext.financialData.summary) {
      if (financeContext.financialData.summary.profitMargin < 15) {
        contextQuestions.push("¿Qué estrategias puedo implementar para mejorar mi margen de beneficio?");
      } else if (financeContext.financialData.summary.profitMargin > 40) {
        contextQuestions.push("¿Cómo puedo mantener mi alto margen de beneficio en los próximos meses?");
      }
    }
    
    // Stripe-related suggestions
    if (financeContext.stripeIncome > 0) {
      contextQuestions.push("¿Cómo han evolucionado las comisiones de Stripe en los últimos meses?");
    }
    
    // Collaborator expense suggestions
    if (financeContext.collaboratorExpenses.length > 3) {
      contextQuestions.push("¿Cuál es la tendencia de gastos en colaboradores durante el último año?");
    }
    
    // Historical analysis suggestions
    contextQuestions.push("¿Existen patrones estacionales en mis ingresos o gastos?");
    contextQuestions.push("¿Puedes identificar anomalías en mis datos financieros históricos?");
    
    // Income source analysis
    if (financeContext.regularIncome > 0 || financeContext.stripeIncome > 0) {
      contextQuestions.push("¿Cómo se distribuyen mis fuentes de ingresos a lo largo del tiempo?");
    }
    
    // Return a mix of context and basic questions, up to 5 total
    return [...contextQuestions, ...basicQuestions].slice(0, 5);
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
