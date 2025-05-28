
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
  const [opexAmount, setOpexAmount] = useState<string>("35"); // Default OPEX amount
  const [itbmAmount, setItbmAmount] = useState<string>("0"); // Default ITBM amount
  const [profitPercentage, setProfitPercentage] = useState<string>("1"); // Default profit percentage
  const [taxReservePercentage, setTaxReservePercentage] = useState<string>("5"); // Default tax reserve percentage
  const [notes, setNotes] = useState<string>("");
  const isMobile = useIsMobile();
  
  // Update form values when the dialog opens or currentBalance changes
  useEffect(() => {
    if (open) {
      console.log("📝 InitialBalanceDialog: Dialog opened, current balance:", currentBalance);
      
      if (currentBalance) {
        console.log("📝 InitialBalanceDialog: Setting form values from currentBalance:", {
          balance: currentBalance.balance,
          opex_amount: currentBalance.opex_amount,
          itbm_amount: currentBalance.itbm_amount,
          profit_percentage: currentBalance.profit_percentage,
          tax_reserve_percentage: currentBalance.tax_reserve_percentage,
          notes: currentBalance.notes
        });
        
        setBalance(currentBalance.balance.toString());
        // Use explicit checks for numbers including 0
        setOpexAmount(currentBalance.opex_amount !== undefined && currentBalance.opex_amount !== null 
          ? currentBalance.opex_amount.toString() 
          : "35");
        setItbmAmount(currentBalance.itbm_amount !== undefined && currentBalance.itbm_amount !== null 
          ? currentBalance.itbm_amount.toString() 
          : "0");
        setProfitPercentage(currentBalance.profit_percentage !== undefined && currentBalance.profit_percentage !== null 
          ? currentBalance.profit_percentage.toString() 
          : "1");
        setTaxReservePercentage(currentBalance.tax_reserve_percentage !== undefined && currentBalance.tax_reserve_percentage !== null 
          ? currentBalance.tax_reserve_percentage.toString() 
          : "5");
        setNotes(currentBalance.notes || "");
        
        console.log("📝 InitialBalanceDialog: Form values set to:", {
          balance: currentBalance.balance.toString(),
          opexAmount: currentBalance.opex_amount !== undefined && currentBalance.opex_amount !== null 
            ? currentBalance.opex_amount.toString() 
            : "35",
          itbmAmount: currentBalance.itbm_amount !== undefined && currentBalance.itbm_amount !== null 
            ? currentBalance.itbm_amount.toString() 
            : "0",
          profitPercentage: currentBalance.profit_percentage !== undefined && currentBalance.profit_percentage !== null 
            ? currentBalance.profit_percentage.toString() 
            : "1",
          taxReservePercentage: currentBalance.tax_reserve_percentage !== undefined && currentBalance.tax_reserve_percentage !== null 
            ? currentBalance.tax_reserve_percentage.toString() 
            : "5",
          notes: currentBalance.notes || ""
        });
      } else {
        // Reset to defaults if no current balance
        console.log("📝 InitialBalanceDialog: No current balance, resetting to defaults");
        setBalance("");
        setOpexAmount("35");
        setItbmAmount("0");
        setProfitPercentage("1");
        setTaxReservePercentage("5");
        setNotes("");
      }
    }
  }, [currentBalance, open]);

  const handleSave = () => {
    console.log("📝 InitialBalanceDialog: SAVE BUTTON CLICKED - Current form values:", {
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
    
    console.log("📝 InitialBalanceDialog: CONVERTED TO NUMBERS:", {
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
    
    console.log("📝 InitialBalanceDialog: CALLING onBalanceSaved with parameters:", {
      numericBalance, 
      numericOpexAmount,
      numericItbmAmount,
      numericProfitPercentage,
      numericTaxReservePercentage,
      notes: notes || undefined
    });
    
    // Call with the correct parameter order: balance, opex, itbm, profit, taxReserve, notes
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
                console.log("📝 Balance input changed to:", e.target.value);
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
                console.log("📝 OPEX input changed to:", e.target.value);
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
                console.log("📝 ITBM input changed to:", e.target.value);
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
                console.log("📝 Profit percentage input changed to:", e.target.value);
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
                console.log("📝 Tax reserve percentage input changed to:", e.target.value);
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
                console.log("📝 Notes input changed to:", e.target.value);
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
