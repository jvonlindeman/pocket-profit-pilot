
import React from 'react';
import { Loader2 } from 'lucide-react';

interface WebhookLoadingProps {
  loading: boolean;
}

const WebhookLoading: React.FC<WebhookLoadingProps> = ({ loading }) => {
  if (!loading) return null;
  
  return (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
};

export default WebhookLoading;
