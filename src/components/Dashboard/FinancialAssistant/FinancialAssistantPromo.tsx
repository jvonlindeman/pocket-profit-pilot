
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircleIcon, TrendingUpIcon, CalendarIcon, BarChart3Icon } from "lucide-react";
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
            Habla con tu asistente de IA para analizar tus finanzas actuales e históricas,
            identificar tendencias y recibir recomendaciones personalizadas.
          </p>
          
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="flex items-start">
              <TrendingUpIcon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <p className="text-xs">Análisis de tendencias en todo tu histórico de datos</p>
            </div>
            <div className="flex items-start">
              <CalendarIcon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <p className="text-xs">Comparaciones mes a mes y año contra año</p>
            </div>
            <div className="flex items-start">
              <BarChart3Icon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <p className="text-xs">Detección de patrones y anomalías en transacciones</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Prueba preguntas como:</p>
            <div className="bg-muted p-2 rounded-md text-xs">
              <ul className="list-disc list-inside space-y-1">
                <li>¿Cómo ha evolucionado mi negocio en el último año?</li>
                <li>¿Cuáles fueron mis mejores meses en términos de beneficio?</li>
                <li>¿Hay tendencias estacionales en mis ingresos?</li>
                <li>¿Cómo se compara este mes con el mismo mes del año pasado?</li>
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
