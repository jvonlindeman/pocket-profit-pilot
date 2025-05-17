
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircleIcon } from 'lucide-react';
import { FinancialAssistantDialog } from './FinancialAssistantDialog';

export const FinancialAssistantButton: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <>
      <Button
        className="h-14 w-14 rounded-full shadow-lg fixed bottom-8 right-8 flex items-center justify-center"
        onClick={() => setDialogOpen(true)}
      >
        <MessageCircleIcon className="h-6 w-6" />
        <span className="sr-only">Asistente Financiero</span>
      </Button>
      
      <FinancialAssistantDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};
