
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface InitialBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  onBalanceSaved: (balance: number, opexAmount: number, itbmAmount: number, profitPercentage: number, notes?: string) => void;
  currentBalance?: {
    balance: number;
    opex_amount?: number;
    itbm_amount?: number;
    profit_percentage?: number;
    notes?: string;
  } | null;
}

const InitialBalanceDialog: React.FC<InitialBalanceDialogProps> = ({
  open,
  onOpenChange,
  currentDate,
  onBalanceSaved,
  currentBalance,
}) => {
  const [balance, setBalance] = useState<string>("");
  const [opexAmount, setOpexAmount] = useState<string>("35"); // Default OPEX amount
  const [itbmAmount, setItbmAmount] = useState<string>("0"); // Default ITBM amount
  const [profitPercentage, setProfitPercentage] = useState<string>("1"); // Default profit percentage
  const [notes, setNotes] = useState<string>("");
  const isMobile = useIsMobile();
  
  // Update form values when the dialog opens or currentBalance changes
  useEffect(() => {
    if (open) {
      console.log("Dialog opened, current balance:", currentBalance);
      
      if (currentBalance) {
        setBalance(currentBalance.balance.toString());
        setOpexAmount(currentBalance.opex_amount !== undefined ? currentBalance.opex_amount.toString() : "35");
        setItbmAmount(currentBalance.itbm_amount !== undefined ? currentBalance.itbm_amount.toString() : "0");
        setProfitPercentage(currentBalance.profit_percentage !== undefined ? currentBalance.profit_percentage.toString() : "1");
        setNotes(currentBalance.notes || "");
      } else {
        // Reset to defaults if no current balance
        setBalance("");
        setOpexAmount("35");
        setItbmAmount("0");
        setProfitPercentage("1");
        setNotes("");
      }
    }
  }, [currentBalance, open]);

  const handleSave = () => {
    console.log("Attempting to save with values:", {
      balance,
      opexAmount,
      itbmAmount,
      profitPercentage,
      notes
    });
    
    const numericBalance = parseFloat(balance);
    const numericOpexAmount = parseFloat(opexAmount || "35");
    const numericItbmAmount = parseFloat(itbmAmount || "0");
    const numericProfitPercentage = parseFloat(profitPercentage || "1");
    
    if (isNaN(numericBalance)) {
      toast({
        title: "Error",
        description: "Por favor ingrese un valor numérico válido para el balance",
        variant: "destructive"
      });
      return;
    }
    
    onBalanceSaved(
      numericBalance, 
      numericOpexAmount,
      numericItbmAmount,
      numericProfitPercentage,
      notes || undefined
    );
    
    onOpenChange(false);
  };

  // Format month name in Spanish
  const monthName = format(currentDate, 'MMMM yyyy', { locale: es });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? "w-[90vw] max-w-md p-4" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>Balance Inicial: {capitalizedMonth}</DialogTitle>
          <DialogDescription>
            Configure el balance financiero inicial para este mes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="balance">Balance Inicial ($)</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="Ingrese el balance inicial"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="opex">OPEX ($)</Label>
            <Input
              id="opex"
              type="number"
              step="0.01"
              value={opexAmount}
              onChange={(e) => setOpexAmount(e.target.value)}
              placeholder="Cantidad fija de OPEX"
              className="w-full"
            />
            <p className="text-xs text-gray-500">Gastos operativos fijos mensuales</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="itbm">ITBM ($)</Label>
            <Input
              id="itbm"
              type="number"
              step="0.01"
              value={itbmAmount}
              onChange={(e) => setItbmAmount(e.target.value)}
              placeholder="Cantidad de ITBM"
              className="w-full"
            />
            <p className="text-xs text-gray-500">Impuestos a pagar (si aplican)</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="profit">% Beneficio</Label>
            <Input
              id="profit"
              type="number"
              step="0.1"
              value={profitPercentage}
              onChange={(e) => setProfitPercentage(e.target.value)}
              placeholder="Porcentaje de beneficio"
              className="w-full"
            />
            <p className="text-xs text-gray-500">Porcentaje de beneficio mensual</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre este balance mensual"
              rows={isMobile ? 2 : 3}
              className="w-full"
            />
          </div>
        </div>
        
        <DialogFooter className={isMobile ? "flex-col space-y-2" : "flex-row space-x-2"}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className={isMobile ? "w-full" : ""}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            className={isMobile ? "w-full" : ""}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InitialBalanceDialog;
