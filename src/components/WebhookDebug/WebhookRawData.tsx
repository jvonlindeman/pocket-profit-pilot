
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface WebhookRawDataProps {
  rawData: any;
}

const WebhookRawData = ({ rawData }: WebhookRawDataProps) => {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(rawData, null, 2);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 relative">
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="text-xs"
        >
          {copied ? (
            <><Check className="h-3 w-3 mr-1" /> Copiado</>
          ) : (
            <><Copy className="h-3 w-3 mr-1" /> Copiar JSON</>
          )}
        </Button>
      </div>
      <div className="max-h-[400px] overflow-auto">
        <pre className="text-xs whitespace-pre-wrap break-words font-mono">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};

export default WebhookRawData;
