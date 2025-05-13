
import React from 'react';

interface WebhookErrorDisplayProps {
  error: string | null;
}

const WebhookErrorDisplay: React.FC<WebhookErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
      <p className="font-medium">Error</p>
      <p className="text-sm">{error}</p>
    </div>
  );
};

export default WebhookErrorDisplay;
