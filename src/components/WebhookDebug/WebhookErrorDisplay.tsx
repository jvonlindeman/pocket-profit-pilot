
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface WebhookErrorDisplayProps {
  error: string | null;
}

const WebhookErrorDisplay: React.FC<WebhookErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  // Check if the error is a JSON parsing error
  const isJsonError = error.includes('JSON') || error.includes('parse');
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
        <div>
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
          
          {isJsonError && (
            <div className="mt-2 text-sm border-t border-red-100 pt-2">
              <p className="font-medium">Sugerencia:</p>
              <p>Este parece ser un error de formato JSON. Verifica que la respuesta del webhook tenga la estructura correcta:</p>
              <pre className="bg-red-100 p-2 mt-1 rounded text-xs overflow-auto">
{`{
  "stripe": "2.699,79",
  "colaboradores": [
    { "total": 668.75, "status": "paid", "vendor_name": "Legalia Panama" },
    { "total": 250, "status": "open", "vendor_name": "Simberk Hernandez" }
  ],
  "expenses": [
    { "date": "2025-05-06", "total": 500, "vendor_name": "", "account_name": "Publicidad y marketing" }
  ],
  "payments": [
    { "date": "2025-05-06", "amount": 642, "customer_name": "FERNANDO AGREDA CASTAÑEDA" }
  ]
}`}
              </pre>
              <p className="mt-2 text-xs text-red-700">
                El formato actual tiene arrays dentro de strings, lo que causa problemas al procesar la respuesta.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebhookErrorDisplay;
