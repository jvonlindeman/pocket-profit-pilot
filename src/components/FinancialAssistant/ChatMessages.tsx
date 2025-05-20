
import React from 'react';
import { ChatMessage } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { LoadingIndicator } from './LoadingIndicator';
import { SuggestedQuestionsList } from './SuggestedQuestionsList';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  suggestedQuestions: string[];
  onSuggestedQuestionClick: (question: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  suggestedQuestions,
  onSuggestedQuestionClick,
  messagesEndRef
}) => {
  const showSuggestedQuestions = messages.length === 1 && !isLoading;
  
  return (
    <ScrollArea className="flex-1 px-4 py-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
        
        {isLoading && <LoadingIndicator />}
        
        {showSuggestedQuestions && (
          <SuggestedQuestionsList
            questions={suggestedQuestions}
            onQuestionClick={onSuggestedQuestionClick}
          />
        )}
      </div>
    </ScrollArea>
  );
};
