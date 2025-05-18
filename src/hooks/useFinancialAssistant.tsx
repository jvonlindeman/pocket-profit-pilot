
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useFinance } from '@/contexts/FinanceContext';
import { captureUIData, optimizeUIData, registerInteraction } from '@/utils/uiDataCapture';

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
}

export const useFinancialAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte hoy? Puedo analizar tus datos financieros actuales, identificar tendencias o responder preguntas específicas sobre tus finanzas.',
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
    sharedInsights: []
  });

  // Helper to extract key insights from assistant responses
  const extractInsights = useCallback((content: string): string[] => {
    const insights: string[] = [];
    
    // Split content into paragraphs
    const paragraphs = content.split('\n\n');
    
    // Look for insights in paragraphs that contain numbers or percentages
    paragraphs.forEach(paragraph => {
      if (
        (paragraph.includes('$') || paragraph.includes('%')) && 
        (paragraph.includes('aumentado') || paragraph.includes('disminuido') || 
         paragraph.includes('tendencia') || paragraph.includes('comparación'))
      ) {
        insights.push(paragraph.trim());
      }
    });
    
    return insights;
  }, []);

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
      // Capture current UI data with detailed logging
      console.log('Capturing UI data for financial assistant...');
      const uiData = captureUIData(financeContext);
      const optimizedUIData = optimizeUIData(uiData);
      
      console.log('UI data captured:', {
        activeComponents: uiData.activeComponents,
        hasSummary: Boolean(uiData.summary),
        transactionCount: uiData.transactions.length,
        expenseCount: uiData.collaboratorExpenses.length
      });
      
      // Prepare messages for the API (exclude 'system' messages)
      const apiMessages = messages
        .filter(msg => msg.role !== 'system')
        .concat(userMessage)
        .map(({ role, content }) => ({ role, content }));
      
      // Track which UI elements were visible for this question
      setConversationContext(prev => ({
        ...prev,
        lastQuery: {
          timestamp: new Date().toISOString(),
          visibleComponents: uiData.activeComponents,
          focusedElement: uiData.focusedElement
        }
      }));
      
      console.log('Sending request to financial-assistant edge function...');
      
      // Call the financial-assistant edge function with UI data
      const { data, error } = await supabase.functions.invoke('financial-assistant', {
        body: {
          messages: apiMessages,
          dateRange: {
            startDate: financeContext.dateRange.startDate?.toISOString() || null,
            endDate: financeContext.dateRange.endDate?.toISOString() || null,
          },
          uiData: optimizedUIData, // Send the optimized UI data to the edge function
          conversationContext // Send additional context about the conversation
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
          sharedInsights: [...prev.sharedInsights, ...newInsights].slice(-10) // Keep last 10 insights
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
    }
  }, [messages, financeContext, setMessages, conversationContext, extractInsights]);
  
  // Clear all messages and reset to initial state
  const resetChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '¡Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte hoy? Puedo analizar tus datos financieros actuales, identificar tendencias o responder preguntas específicas sobre tus finanzas.',
        timestamp: new Date(),
      },
    ]);
    setConversationContext({
      lastQuery: {
        timestamp: '',
        visibleComponents: [],
        focusedElement: null
      },
      sharedInsights: []
    }); 
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    resetChat,
    conversationContext
  };
};
