
import React, { useState, useRef, useEffect } from 'react';
import { useFinancialAssistant, ChatMessage } from '@/hooks/useFinancialAssistant';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendIcon, RefreshCcwIcon, MessageCircleIcon, SearchIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { registerInteraction } from '@/utils/uiDataCapture';

interface FinancialAssistantDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatTimestamp = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-foreground'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <span className="block text-xs mt-1 opacity-70">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

const SuggestedQuestion: React.FC<{ question: string; onClick: (question: string) => void }> = ({ 
  question, 
  onClick 
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="mb-2 text-xs text-left justify-start h-auto py-2 px-3 whitespace-normal"
      onClick={() => onClick(question)}
    >
      <SearchIcon className="h-3 w-3 mr-2 flex-shrink-0" />
      <span>{question}</span>
    </Button>
  );
};

export const FinancialAssistantDialog: React.FC<FinancialAssistantDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { messages, isLoading, sendMessage, resetChat, getSuggestedQuestions } = useFinancialAssistant();
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
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[700px] flex flex-col p-0 financial-assistant-dialog" data-component="financial-assistant">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center">
            <MessageCircleIcon className="mr-2 h-5 w-5" />
            Asistente Financiero
          </DialogTitle>
          <DialogDescription>
            Habla con tu asistente para analizar tus finanzas y descubrir insights históricos
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
            
            {isLoading && (
              <div className="flex justify-center my-4">
                <RefreshCcwIcon className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {/* Show suggested questions only when there's more than just the welcome message */}
            {messages.length === 1 && !isLoading && (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Preguntas sugeridas:</p>
                <div className="flex flex-col gap-2 mt-2">
                  {suggestedQuestions.map((question, index) => (
                    <SuggestedQuestion
                      key={`suggested-${index}`}
                      question={question}
                      onClick={handleSuggestedQuestionClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
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
          
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe tu pregunta..."
              disabled={isLoading}
              className="pr-10"
              maxLength={1000}
            />
            <Button
              size="icon"
              variant="ghost"
              disabled={isLoading || !inputValue.trim()}
              onClick={handleSend}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
