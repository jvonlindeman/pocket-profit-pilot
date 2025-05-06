
import React from 'react';

interface WebhookErrorDisplayProps {
  error: string | null;
}

const WebhookErrorDisplay: React.FC<WebhookErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  // Check if the error is a JSON parsing error
  const isJsonError = error.includes('JSON') || error.includes('parse');
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
      <p className="font-medium">Error</p>
      <p className="text-sm">{error}</p>
      
      {isJsonError && (
        <div className="mt-2 text-sm border-t border-red-100 pt-2">
          <p className="font-medium">Sugerencia:</p>
          <p>Este parece ser un error de formato JSON. Verifica que la respuesta del webhook tenga la estructura correcta:</p>
          <pre className="bg-red-100 p-2 mt-1 rounded text-xs overflow-auto">
{`{
  "stripe": "2.699,79",
  "colaboradores": [...],
  "expenses": [...],
  "payments": [...]
}`}
          </pre>
        </div>
      )}
    </div>
  );
};

export default WebhookErrorDisplay;
