
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircleIcon } from "lucide-react";
import { FinancialAssistantDialog } from '@/components/FinancialAssistant/FinancialAssistantDialog';

export const FinancialAssistantPromo: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <MessageCircleIcon className="h-5 w-5 mr-2" />
            Asistente Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Habla con tu asistente de IA para analizar tus finanzas, recibir recomendaciones
            o hacer preguntas sobre tus datos financieros.
          </p>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Prueba preguntas como:</p>
            <div className="bg-muted p-2 rounded-md text-xs">
              <ul className="list-disc list-inside space-y-1">
                <li>¿Cuál es mi margen de beneficio actual?</li>
                <li>¿Cómo puedo reducir mis gastos?</li>
                <li>¿Hay tendencias en mis ingresos recientes?</li>
                <li>¿Qué categorías de gastos han aumentado más?</li>
              </ul>
            </div>
          </div>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="w-full mt-4"
            size="sm"
          >
            <MessageCircleIcon className="h-4 w-4 mr-2" />
            Abrir Asistente
          </Button>
        </CardContent>
      </Card>
      
      <FinancialAssistantDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};
