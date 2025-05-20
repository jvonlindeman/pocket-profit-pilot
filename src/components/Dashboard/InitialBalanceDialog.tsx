
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { MonthlyBalance } from '@/types/financial';

interface InitialBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  onBalanceSaved: (
    balance: number, 
    opexAmount?: number, 
    itbmAmount?: number, 
    profitPercentage?: number, 
    notes?: string
  ) => void;
  currentBalance?: MonthlyBalance | null;
}

const formSchema = z.object({
  balance: z.coerce.number().min(0, "El saldo debe ser mayor o igual a 0"),
  opexAmount: z.coerce.number().min(0, "El monto OPEX debe ser mayor o igual a 0"),
  itbmAmount: z.coerce.number().min(0, "El monto ITBM debe ser mayor o igual a 0"),
  profitPercentage: z.coerce.number().min(0, "El porcentaje de ganancia debe ser mayor o igual a 0"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const InitialBalanceDialog: React.FC<InitialBalanceDialogProps> = ({
  open,
  onOpenChange,
  currentDate,
  onBalanceSaved,
  currentBalance
}) => {
  // Ensure currentDate is a valid date object
  const safeCurrentDate = currentDate && !isNaN(currentDate.getTime()) 
    ? currentDate 
    : new Date();
    
  const { updateMonthlyBalance, loading } = useMonthlyBalance({ 
    currentDate: safeCurrentDate 
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      balance: currentBalance?.balance || 0,
      opexAmount: currentBalance?.opex_amount || 35,
      itbmAmount: currentBalance?.itbm_amount || 0,
      profitPercentage: currentBalance?.profit_percentage || 1,
      notes: currentBalance?.notes || '',
    },
  });

  // Update form values when currentBalance changes
  useEffect(() => {
    if (currentBalance) {
      form.reset({
        balance: currentBalance.balance || 0,
        opexAmount: currentBalance.opex_amount || 35,
        itbmAmount: currentBalance.itbm_amount || 0,
        profitPercentage: currentBalance.profit_percentage || 1,
        notes: currentBalance.notes || '',
      });
    }
  }, [currentBalance, form]);

  // Safely format month name in Spanish with error handling
  const formattedMonth = (() => {
    try {
      // Make sure we have a valid date
      if (!safeCurrentDate || isNaN(safeCurrentDate.getTime())) {
        console.error("Invalid date in InitialBalanceDialog:", safeCurrentDate);
        return format(new Date(), 'MMMM yyyy', { locale: es });
      }
      
      return format(safeCurrentDate, 'MMMM yyyy', { locale: es });
    } catch (err) {
      console.error("Error formatting month:", err);
      return format(new Date(), 'MMMM yyyy', { locale: es });
    }
  })();
  
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  const onSubmit = async (data: FormValues) => {
    console.log("Submitting form data:", data);
    
    // Update the database
    const success = await updateMonthlyBalance(
      Number(data.balance),
      Number(data.opexAmount),  
      Number(data.itbmAmount),
      Number(data.profitPercentage),
      data.notes || ''
    );
    
    if (success) {
      // Notify parent component
      onBalanceSaved(
        Number(data.balance),
        Number(data.opexAmount),  
        Number(data.itbmAmount),
        Number(data.profitPercentage),
        data.notes || ''
      );
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Balance Inicial</DialogTitle>
          <DialogDescription>
            Establece el balance inicial para {capitalizedMonth} antes de cargar los datos financieros.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Saldo al inicio del mes antes de cualquier transacción
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="opexAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OPEX ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="35.00" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Monto para gastos operativos
                  </FormDescription>
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
                      placeholder="0.00" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Impuesto sobre transferencia de bienes muebles
                  </FormDescription>
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
                      placeholder="1.0" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Porcentaje para reinversión en el negocio
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Añade notas o comentarios sobre este balance" 
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={loading}
              >
                Guardar y Continuar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InitialBalanceDialog;
