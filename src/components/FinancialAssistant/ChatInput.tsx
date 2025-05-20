
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendIcon } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  inputRef
}) => {
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };
  
  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Escribe tu pregunta..."
        disabled={isLoading}
        className="pr-10"
        maxLength={1000}
      />
      <Button
        size="icon"
        variant="ghost"
        disabled={isLoading || !value.trim()}
        onClick={onSubmit}
        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
      >
        <SendIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
