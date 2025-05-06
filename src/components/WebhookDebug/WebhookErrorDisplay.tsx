
import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface WebhookErrorDisplayProps {
  error: string | null;
}

const WebhookErrorDisplay: React.FC<WebhookErrorDisplayProps> = ({ error }) => {
  const { toast } = useToast();
  
  if (!error) return null;
  
  const isJsonError = error.includes('JSON') || error.includes('parse');
  const isConnectionError = error.includes('connect') || error.includes('fetch') || error.includes('network');
  const isAuthError = error.includes('auth') || error.includes('unauthorized') || error.includes('permission');
  
  const copyExampleToClipboard = () => {
    const example = `{
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
}`;
    
    navigator.clipboard.writeText(example);
    toast({
      title: "Ejemplo copiado",
      description: "El formato JSON de ejemplo ha sido copiado al portapapeles",
    });
  };
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="font-semibold">Error al recuperar datos</AlertTitle>
      <AlertDescription className="mt-1">
        <p className="text-sm">{error}</p>
        
        {isJsonError && (
          <div className="mt-3 pt-3 border-t border-red-300">
            <div className="flex items-start">
              <HelpCircle className="h-4 w-4 mt-0.5 mr-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Problema de formato JSON</p>
                <p className="text-xs mt-1">
                  La respuesta del webhook tiene un formato JSON incorrecto. Esto puede ocurrir cuando:
                </p>
                <ul className="list-disc text-xs ml-4 mt-1 space-y-1">
                  <li>Los arrays no están formateados correctamente</li>
                  <li>Hay caracteres especiales no escapados</li>
                  <li>La estructura de la respuesta no coincide con lo esperado</li>
                </ul>
                
                <div className="mt-3 bg-red-50 p-2 rounded text-xs">
                  <p className="font-medium mb-1">Formato esperado:</p>
                  <pre className="bg-white/40 p-2 rounded overflow-auto text-[10px] max-h-[200px]">
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
                </div>
                
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={copyExampleToClipboard}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
                  >
                    Copiar ejemplo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isConnectionError && (
          <div className="mt-3 pt-3 border-t border-red-300">
            <div className="flex items-start">
              <HelpCircle className="h-4 w-4 mt-0.5 mr-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Problema de conexión</p>
                <p className="text-xs mt-1">
                  No se pudo establecer conexión con el servicio. Verifica:
                </p>
                <ul className="list-disc text-xs ml-4 mt-1 space-y-1">
                  <li>La conexión a Internet</li>
                  <li>Que el servicio de Make.com esté funcionando</li>
                  <li>La configuración de Zoho Books</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {isAuthError && (
          <div className="mt-3 pt-3 border-t border-red-300">
            <div className="flex items-start">
              <HelpCircle className="h-4 w-4 mt-0.5 mr-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Problema de autenticación</p>
                <p className="text-xs mt-1">
                  Error de autenticación con Zoho Books. Verifica:
                </p>
                <ul className="list-disc text-xs ml-4 mt-1 space-y-1">
                  <li>Las credenciales de Zoho</li>
                  <li>El estado de la conexión OAuth</li>
                  <li>Los permisos de la API</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-xs">
          <p className="font-medium">¿Qué hacer ahora?</p>
          <ul className="list-decimal ml-4 mt-1 space-y-1">
            <li>Intenta refrescar los datos con el botón "Actualizar"</li>
            <li>Revisa la configuración de Make.com para verificar el formato de la respuesta</li>
            <li>Si el problema persiste, consulta los logs para más detalles</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default WebhookErrorDisplay;
