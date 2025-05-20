
import React from 'react';
import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';

interface SuggestedQuestionProps {
  question: string;
  onClick: (question: string) => void;
}

export const SuggestedQuestion: React.FC<SuggestedQuestionProps> = ({ 
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
