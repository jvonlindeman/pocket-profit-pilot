
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
  onBalanceSaved: (balance: number, opexAmount: number, itbmAmount: number, profitPercentage: number, taxReservePercentage: number, notes?: string) => void;
  currentBalance?: {
    balance: number;
    opex_amount?: number;
    itbm_amount?: number;
    profit_percentage?: number;
    tax_reserve_percentage?: number;
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
  const [opexAmount, setOpexAmount] = useState<string>("35");
  const [itbmAmount, setItbmAmount] = useState<string>("0");
  const [profitPercentage, setProfitPercentage] = useState<string>("1");
  const [taxReservePercentage, setTaxReservePercentage] = useState<string>("5");
  const [notes, setNotes] = useState<string>("");
  const isMobile = useIsMobile();
  
  // Debug: Log what currentBalance we receive
  useEffect(() => {
    console.log("🔍 DIALOG DEBUG: currentBalance prop changed:", {
      currentBalance,
      hasCurrentBalance: !!currentBalance,
      values: currentBalance ? {
        balance: currentBalance.balance,
        opex_amount: currentBalance.opex_amount,
        itbm_amount: currentBalance.itbm_amount,
        profit_percentage: currentBalance.profit_percentage,
        tax_reserve_percentage: currentBalance.tax_reserve_percentage,
        notes: currentBalance.notes
      } : null
    });
  }, [currentBalance]);
  
  // Update form values when the dialog opens AND currentBalance changes
  useEffect(() => {
    if (open) {
      console.log("🔍 DIALOG OPENING: Setting form values from currentBalance:", currentBalance);
      
      if (currentBalance) {
        // Use the EXACT values from the database, including 0
        const balanceValue = currentBalance.balance.toString();
        const opexValue = typeof currentBalance.opex_amount === 'number' ? currentBalance.opex_amount.toString() : "35";
        const itbmValue = typeof currentBalance.itbm_amount === 'number' ? currentBalance.itbm_amount.toString() : "0";
        const profitValue = typeof currentBalance.profit_percentage === 'number' ? currentBalance.profit_percentage.toString() : "1";
        const taxReserveValue = typeof currentBalance.tax_reserve_percentage === 'number' ? currentBalance.tax_reserve_percentage.toString() : "5";
        const notesValue = currentBalance.notes || "";
        
        console.log("🔍 SETTING FORM VALUES:", {
          balance: balanceValue,
          opex: opexValue,
          itbm: itbmValue,
          profit: profitValue,
          taxReserve: taxReserveValue,
          notes: notesValue
        });
        
        setBalance(balanceValue);
        setOpexAmount(opexValue);
        setItbmAmount(itbmValue);
        setProfitPercentage(profitValue);
        setTaxReservePercentage(taxReserveValue);
        setNotes(notesValue);
      } else {
        // Reset to defaults if no current balance
        console.log("🔍 NO CURRENT BALANCE: Resetting to defaults");
        setBalance("");
        setOpexAmount("35");
        setItbmAmount("0");
        setProfitPercentage("1");
        setTaxReservePercentage("5");
        setNotes("");
      }
    }
  }, [open, currentBalance]); // React to BOTH open state AND currentBalance changes

  const handleSave = () => {
    console.log("🔍 SAVE CLICKED: Current form values:", {
      balance,
      opexAmount,
      itbmAmount,
      profitPercentage,
      taxReservePercentage,
      notes
    });
    
    const numericBalance = parseFloat(balance);
    const numericOpexAmount = parseFloat(opexAmount || "35");
    const numericItbmAmount = parseFloat(itbmAmount || "0");
    const numericProfitPercentage = parseFloat(profitPercentage || "1");
    const numericTaxReservePercentage = parseFloat(taxReservePercentage || "5");
    
    console.log("🔍 CONVERTED VALUES:", {
      numericBalance,
      numericOpexAmount,
      numericItbmAmount,
      numericProfitPercentage,
      numericTaxReservePercentage,
      notes
    });
    
    if (isNaN(numericBalance)) {
      toast({
        title: "Error",
        description: "Por favor ingrese un valor numérico válido para el balance",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(numericTaxReservePercentage) || numericTaxReservePercentage < 0 || numericTaxReservePercentage > 100) {
      toast({
        title: "Error",
        description: "Por favor ingrese un porcentaje válido para la reserva de impuestos (0-100%)",
        variant: "destructive"
      });
      return;
    }
    
    console.log("🔍 CALLING onBalanceSaved with:", {
      numericBalance, 
      numericOpexAmount,
      numericItbmAmount,
      numericProfitPercentage,
      numericTaxReservePercentage,
      notes: notes || undefined
    });
    
    onBalanceSaved(
      numericBalance, 
      numericOpexAmount,
      numericItbmAmount,
      numericProfitPercentage,
      numericTaxReservePercentage,
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
            Configure el balance financiero inicial y parámetros de cálculo para este mes.
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
              onChange={(e) => {
                console.log("🔍 Balance input changed to:", e.target.value);
                setBalance(e.target.value);
              }}
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
              onChange={(e) => {
                console.log("🔍 OPEX input changed to:", e.target.value);
                setOpexAmount(e.target.value);
              }}
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
              onChange={(e) => {
                console.log("🔍 ITBM input changed to:", e.target.value);
                setItbmAmount(e.target.value);
              }}
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
              onChange={(e) => {
                console.log("🔍 Profit percentage input changed to:", e.target.value);
                setProfitPercentage(e.target.value);
              }}
              placeholder="Porcentaje de beneficio"
              className="w-full"
            />
            <p className="text-xs text-gray-500">Porcentaje de beneficio mensual</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="taxReserve">% Reserva para Impuestos</Label>
            <Input
              id="taxReserve"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={taxReservePercentage}
              onChange={(e) => {
                console.log("🔍 Tax reserve percentage input changed to:", e.target.value);
                setTaxReservePercentage(e.target.value);
              }}
              placeholder="Porcentaje de reserva para impuestos"
              className="w-full"
            />
            <p className="text-xs text-gray-500">Porcentaje de ingresos reservado para impuestos (recomendado: 5%)</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                console.log("🔍 Notes input changed to:", e.target.value);
                setNotes(e.target.value);
              }}
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
