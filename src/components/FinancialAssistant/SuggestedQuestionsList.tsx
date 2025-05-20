
import React from 'react';
import { SuggestedQuestion } from './SuggestedQuestion';

interface SuggestedQuestionsListProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export const SuggestedQuestionsList: React.FC<SuggestedQuestionsListProps> = ({
  questions,
  onQuestionClick
}) => {
  if (!questions.length) return null;
  
  return (
    <div className="mt-6 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Preguntas sugeridas:</p>
      <div className="flex flex-col gap-2 mt-2">
        {questions.map((question, index) => (
          <SuggestedQuestion
            key={`suggested-${index}`}
            question={question}
            onClick={onQuestionClick}
          />
        ))}
      </div>
    </div>
  );
};
