
import React from 'react';

interface WebhookRawDataProps {
  rawData: any;
}

const WebhookRawData: React.FC<WebhookRawDataProps> = ({ rawData }) => {
  if (!rawData) return null;
  
  // Check if there's a raw_response property
  const displayContent = rawData.raw_response || rawData;
  
  // Handle different types of content
  const getFormattedContent = () => {
    if (typeof displayContent === 'string') {
      return displayContent;
    } else {
      try {
        return JSON.stringify(displayContent, null, 2);
      } catch (error) {
        return String(displayContent);
      }
    }
  };
  
  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
      <pre className="text-xs whitespace-pre-wrap break-words">
        {getFormattedContent()}
      </pre>
    </div>
  );
};

export default WebhookRawData;
