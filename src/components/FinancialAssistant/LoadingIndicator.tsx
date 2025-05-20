
import React from 'react';
import { RefreshCcwIcon } from 'lucide-react';

export const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex justify-center my-4">
      <RefreshCcwIcon className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
};
