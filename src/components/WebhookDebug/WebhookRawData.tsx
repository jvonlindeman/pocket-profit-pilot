
import React from 'react';

interface WebhookRawDataProps {
  rawData: any;
}

const WebhookRawData = ({ rawData }: WebhookRawDataProps) => {
  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
      <pre className="text-xs whitespace-pre-wrap break-words">
        {JSON.stringify(rawData, null, 2)}
      </pre>
    </div>
  );
};

export default WebhookRawData;
