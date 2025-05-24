
import React, { useState, useRef, useEffect } from 'react';
import { useFinancialAssistant } from '@/hooks/useFinancialAssistant';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCcwIcon, MessageCircleIcon, SearchIcon } from 'lucide-react';
import { registerInteraction } from '@/utils/uiCapture';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

interface FinancialAssistantDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinancialAssistantDialog: React.FC<FinancialAssistantDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { messages, isLoading, sendMessage, resetChat, getSuggestedQuestions, semanticSearchResults } = useFinancialAssistant();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestedQuestions = getSuggestedQuestions();
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      // Register assistant dialog opened
      registerInteraction('financial-assistant-dialog', 'click', { opened: true });
    }
  }, [isOpen]);
  
  // Register dialog close
  const handleClose = () => {
    registerInteraction('financial-assistant-dialog', 'click', { closed: true });
    onClose();
  };
  
  // Handle sending a message
  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      registerInteraction('financial-assistant-input', 'select', { query: inputValue });
      sendMessage(inputValue);
      setInputValue('');
    }
  };
  
  // Handle suggested question click
  const handleSuggestedQuestionClick = (question: string) => {
    if (!isLoading) {
      registerInteraction('financial-assistant-suggestion', 'click', { query: question });
      sendMessage(question);
    }
  };
  
  // Handle reset chat
  const handleResetChat = () => {
    registerInteraction('financial-assistant-reset', 'click');
    resetChat();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] max-h-[800px] flex flex-col p-0 financial-assistant-dialog" data-component="financial-assistant">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center">
            <MessageCircleIcon className="mr-2 h-5 w-5" />
            Asistente Financiero
            {semanticSearchResults.length > 0 && (
              <span className="ml-2 flex items-center text-sm text-blue-600">
                <SearchIcon className="h-4 w-4 mr-1" />
                {semanticSearchResults.length} resultados
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Habla con tu asistente para analizar tus finanzas, buscar transacciones específicas y descubrir insights históricos con búsqueda semántica avanzada
          </DialogDescription>
        </DialogHeader>
        
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          suggestedQuestions={suggestedQuestions}
          onSuggestedQuestionClick={handleSuggestedQuestionClick}
          messagesEndRef={messagesEndRef}
        />
        
        <DialogFooter className="px-4 py-3 border-t flex items-center">
          <Button
            variant="outline"
            size="icon"
            disabled={isLoading}
            onClick={handleResetChat}
            title="Nueva conversación"
            className="mr-2 flex-shrink-0"
          >
            <RefreshCcwIcon className="h-4 w-4" />
          </Button>
          
          <ChatInput
            inputRef={inputRef}
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSend}
            isLoading={isLoading}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
