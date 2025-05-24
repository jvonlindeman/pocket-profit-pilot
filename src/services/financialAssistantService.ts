
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, ConversationMemory } from '@/types/chat';
import { toast } from '@/hooks/use-toast';

/**
 * Sends a message to the financial assistant edge function
 * @param messages The chat message history
 * @param userMessage The new user message
 * @param dateRange The current date range
 * @param uiData Data captured from the UI
 * @param conversationContext Additional context about the conversation
 * @returns The assistant's response content or throws an error
 */
export const sendMessageToAssistant = async (
  messages: ChatMessage[],
  userMessage: ChatMessage,
  dateRange: { startDate: Date | null; endDate: Date | null },
  uiData: any,
  conversationContext: ConversationMemory
): Promise<string | { content: string; searchResults?: any[]; searchPerformed?: boolean }> => {
  // Prepare messages for the API (exclude 'system' messages)
  const apiMessages = messages
    .filter(msg => msg.role !== 'system')
    .concat(userMessage)
    .map(({ role, content }) => ({ role, content }));
  
  console.log('Sending request to financial-assistant edge function with semantic search support...');
  
  // Call the financial-assistant edge function with enhanced UI data
  const { data, error } = await supabase.functions.invoke('financial-assistant', {
    body: {
      messages: apiMessages,
      dateRange: {
        startDate: dateRange.startDate?.toISOString() || null,
        endDate: dateRange.endDate?.toISOString() || null,
      },
      uiData, // Send the optimized UI data to the edge function
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
  
  // If semantic search was performed, return the full response object
  if (data.searchPerformed && data.searchResults) {
    return {
      content: data.response.content,
      searchResults: data.searchResults,
      searchPerformed: data.searchPerformed
    };
  }
  
  return data.response.content;
};
