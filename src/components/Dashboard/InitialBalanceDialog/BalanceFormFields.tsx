
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface BalanceFormFieldsProps {
  balance: string;
  setBalance: (value: string) => void;
  opexAmount: string;
  setOpexAmount: (value: string) => void;
  itbmAmount: string;
  setItbmAmount: (value: string) => void;
  profitPercentage: string;
  setProfitPercentage: (value: string) => void;
  taxReservePercentage: string;
  setTaxReservePercentage: (value: string) => void;
  stripeSavingsPercentage: string;
  setStripeSavingsPercentage: (value: string) => void;
  includeZohoFiftyPercent: boolean;
  setIncludeZohoFiftyPercent: (value: boolean) => void;
  notes: string;
  setNotes: (value: string) => void;
}

const BalanceFormFields: React.FC<BalanceFormFieldsProps> = ({
  balance,
  setBalance,
  opexAmount,
  setOpexAmount,
  itbmAmount,
  setItbmAmount,
  profitPercentage,
  setProfitPercentage,
  taxReservePercentage,
  setTaxReservePercentage,
  stripeSavingsPercentage,
  setStripeSavingsPercentage,
  includeZohoFiftyPercent,
  setIncludeZohoFiftyPercent,
  notes,
  setNotes,
}) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="balance" className="text-right">
          Balance Inicial
        </Label>
        <Input
          id="balance"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="col-span-3"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="opex" className="text-right">
          OPEX ($)
        </Label>
        <Input
          id="opex"
          type="number"
          step="0.01"
          placeholder="35.00"
          value={opexAmount}
          onChange={(e) => setOpexAmount(e.target.value)}
          className="col-span-3"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="itbm" className="text-right">
          ITBM ($)
        </Label>
        <Input
          id="itbm"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={itbmAmount}
          onChange={(e) => setItbmAmount(e.target.value)}
          className="col-span-3"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="profit" className="text-right">
          Profit First (%)
        </Label>
        <Input
          id="profit"
          type="number"
          step="0.1"
          placeholder="1.0"
          value={profitPercentage}
          onChange={(e) => setProfitPercentage(e.target.value)}
          className="col-span-3"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="taxReserve" className="text-right">
          Tax Reserve (%)
        </Label>
        <Input
          id="taxReserve"
          type="number"
          step="0.1"
          placeholder="5.0"
          value={taxReservePercentage}
          onChange={(e) => setTaxReservePercentage(e.target.value)}
          className="col-span-3"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="stripeSavings" className="text-right">
          Stripe Savings (%)
        </Label>
        <Input
          id="stripeSavings"
          type="number"
          step="0.1"
          placeholder="0.0"
          value={stripeSavingsPercentage}
          onChange={(e) => setStripeSavingsPercentage(e.target.value)}
          className="col-span-3"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="includeZoho" className="text-right">
          Incluir 50% Zoho
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Switch
            id="includeZoho"
            checked={includeZohoFiftyPercent}
            onCheckedChange={setIncludeZohoFiftyPercent}
          />
          <Label htmlFor="includeZoho" className="text-sm text-gray-600">
            Incluir 50% del Zoho restante en el cálculo del salario
          </Label>
        </div>
      </div>
      
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="notes" className="text-right pt-2">
          Notas
        </Label>
        <Textarea
          id="notes"
          placeholder="Notas opcionales..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="col-span-3"
          rows={3}
        />
      </div>
    </div>
  );
};

export default BalanceFormFields;
