
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Plus, DollarSign } from 'lucide-react';
import ManualStripeForm from './ManualStripeForm';
import StripeOverrideForm from './StripeOverrideForm';

interface StripeTransactionManagerProps {
  onTransactionAdded?: () => void;
  currentDate?: Date;
  stripeOverride?: number | null;
}

const StripeTransactionManager: React.FC<StripeTransactionManagerProps> = ({ 
  onTransactionAdded,
  currentDate,
  stripeOverride
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-500" /> 
          Gestión de Ingresos Stripe
        </CardTitle>
        <CardDescription>
          Añade transacciones de Stripe manualmente o configura un valor fijo mensual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="manual" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" /> Transacción Manual
            </TabsTrigger>
            <TabsTrigger value="override" className="flex items-center">
              <Edit className="h-4 w-4 mr-2" /> Valor Mensual Fijo
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <ManualStripeForm onTransactionAdded={onTransactionAdded} />
          </TabsContent>
          
          <TabsContent value="override">
            <StripeOverrideForm 
              currentDate={currentDate} 
              currentOverride={stripeOverride}
              onOverrideUpdated={onTransactionAdded} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StripeTransactionManager;
