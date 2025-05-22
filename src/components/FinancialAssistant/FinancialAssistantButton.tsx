
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircleIcon } from 'lucide-react';
import { FinancialAssistantDialog } from './FinancialAssistantDialog';
import { useIsMobile } from '@/hooks/use-mobile';

export const FinancialAssistantButton: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <>
      <Button
        className={`${isMobile ? 'h-12 w-12' : 'h-14 w-14'} rounded-full shadow-lg fixed bottom-6 right-6 md:bottom-8 md:right-8 flex items-center justify-center`}
        onClick={() => setDialogOpen(true)}
      >
        <MessageCircleIcon className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
        <span className="sr-only">Asistente Financiero</span>
      </Button>
      
      <FinancialAssistantDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};
