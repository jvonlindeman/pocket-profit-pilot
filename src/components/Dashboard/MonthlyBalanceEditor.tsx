
import React, { useState, useEffect } from 'react';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { Calculator, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonthlyBalanceEditorProps {
  currentDate: Date;
  onBalanceChange?: (balance: number) => void;
}

const MonthlyBalanceEditor: React.FC<MonthlyBalanceEditorProps> = ({ 
  currentDate,
  onBalanceChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { monthlyBalance, updateMonthlyBalance, loading } = useMonthlyBalance({ currentDate });
  
  const form = useForm({
    defaultValues: {
      balance: 0,
      opexAmount: 35,
      itbmAmount: 0,
      profitPercentage: 1,
      notes: '',
    }
  });

  // Update form when monthlyBalance changes
  useEffect(() => {
    if (monthlyBalance) {
      form.reset({
        balance: monthlyBalance.balance,
        opexAmount: monthlyBalance.opex_amount,
        itbmAmount: monthlyBalance.itbm_amount,
        profitPercentage: monthlyBalance.profit_percentage,
        notes: monthlyBalance.notes || '',
      });
    } else {
      form.reset({
        balance: 0,
        opexAmount: 35,
        itbmAmount: 0,
        profitPercentage: 1,
        notes: '',
      });
    }
  }, [monthlyBalance, form]);

  const onSubmit = async (data: any) => {
    const success = await updateMonthlyBalance(
      Number(data.balance),
      Number(data.opexAmount),
      Number(data.itbmAmount),
      Number(data.profitPercentage),
      data.notes
    );
    
    if (success) {
      setIsEditing(false);
      
      // Notify parent component about the balance change to update the calculator
      if (onBalanceChange) {
        console.log("Notifying parent about balance change:", Number(data.balance));
        onBalanceChange(Number(data.balance));
      }
    }
  };

  const formattedMonth = format(currentDate, 'MMMM yyyy', { locale: es });
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-gray-800">
          <Calculator className="h-5 w-5 mr-2" />
          Configuración del Balance - {capitalizedMonth}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Balance Inicial</div>
                <div className="font-bold flex items-center text-gray-900">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {monthlyBalance ? monthlyBalance.balance.toFixed(2) : '0.00'}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">OPEX</div>
                <div className="font-bold text-gray-900">
                  ${monthlyBalance ? monthlyBalance.opex_amount.toFixed(2) : '35.00'}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">ITBM</div>
                <div className="font-bold text-gray-900">
                  ${monthlyBalance ? monthlyBalance.itbm_amount.toFixed(2) : '0.00'}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Profit First</div>
                <div className="font-bold text-gray-900">
                  {monthlyBalance ? monthlyBalance.profit_percentage.toFixed(1) : '1.0'}%
                </div>
              </div>
            </div>
            
            {monthlyBalance?.notes && (
              <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <div className="font-medium mb-1">Notas:</div>
                <div>{monthlyBalance.notes}</div>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Balance Inicial ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="opexAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OPEX (Cantidad $)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="itbmAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ITBM ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="profitPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit First (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  Guardar
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
      
      {!isEditing && (
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="w-full"
          >
            Editar Balance
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default MonthlyBalanceEditor;
