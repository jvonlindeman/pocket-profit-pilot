
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

interface InitialBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  onBalanceSaved: () => void;
}

const formSchema = z.object({
  balance: z.coerce.number().min(0, "El saldo debe ser mayor o igual a 0"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const InitialBalanceDialog: React.FC<InitialBalanceDialogProps> = ({
  open,
  onOpenChange,
  currentDate,
  onBalanceSaved
}) => {
  const { updateMonthlyBalance, loading, monthlyBalance, checkBalanceExists } = useMonthlyBalance({ currentDate });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      balance: 0,
      notes: '',
    },
  });

  // Load existing balance data when dialog opens or when monthlyBalance changes
  useEffect(() => {
    if (open && monthlyBalance) {
      form.reset({
        balance: monthlyBalance.balance,
        notes: monthlyBalance.notes || '',
      });
    } else if (open) {
      // If dialog is opened but no balance exists yet, reset to defaults
      form.reset({
        balance: 0,
        notes: '',
      });
    }
  }, [open, monthlyBalance, form]);

  // Format month name in Spanish
  const formattedMonth = format(currentDate, 'MMMM yyyy', { locale: es });
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  const onSubmit = async (data: FormValues) => {
    const success = await updateMonthlyBalance(data.balance, data.notes);
    if (success) {
      onOpenChange(false);
      onBalanceSaved();
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
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={loading}
              >
                {monthlyBalance ? 'Actualizar Balance' : 'Guardar y Continuar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InitialBalanceDialog;
