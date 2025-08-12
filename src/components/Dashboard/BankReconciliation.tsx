import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFinance } from '@/contexts/FinanceContext';
import { Wallet, Plus, Minus, Equal, Settings, Filter, ListTree, Info } from 'lucide-react';

interface BankReconciliationProps {
  startingBalance: number;
  zohoIncome: number;
  totalZohoExpenses: number;
  adjustedZohoIncome: number; // starting + zohoIncome - totalZohoExpenses
  onEditInitialBalance?: () => void;
}

const STORAGE_KEY_PREFIX = 'bankReconciliationExcludedCategories:';

const withinRange = (dateStr: string, start?: Date | null, end?: Date | null) => {
  const d = new Date(dateStr);
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

const BankReconciliation: React.FC<BankReconciliationProps> = ({
  startingBalance,
  zohoIncome,
  totalZohoExpenses,
  adjustedZohoIncome,
  onEditInitialBalance,
}) => {
  const { transactions, dateRange, formatCurrency } = useFinance();
  const [showDetails, setShowDetails] = useState(false);
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);

  const storageKey = useMemo(() => {
    const startKey = dateRange.startDate ? dateRange.startDate.toISOString().slice(0, 10) : 'na';
    const endKey = dateRange.endDate ? dateRange.endDate.toISOString().slice(0, 10) : 'na';
    return `${STORAGE_KEY_PREFIX}${startKey}_${endKey}`;
  }, [dateRange.startDate, dateRange.endDate]);

  const [excludedCategories, setExcludedCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}fallback`) || localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(excludedCategories));
      // Keep a fallback as well
      localStorage.setItem(`${STORAGE_KEY_PREFIX}fallback`, JSON.stringify(excludedCategories));
    } catch { }
  }, [excludedCategories, storageKey]);

  // Build expense categories from Zoho transactions in range
  const { categoryTotals, topCategories, excludedAmount } = useMemo(() => {
    const totals: Record<string, number> = {};
    let excluded = 0;

    for (const tx of transactions) {
      if (tx.source !== 'Zoho' || tx.type !== 'expense') continue;
      if (!withinRange(tx.date, dateRange.startDate, dateRange.endDate)) continue;
      const cat = tx.category || 'Sin categoría';
      totals[cat] = (totals[cat] || 0) + Math.abs(tx.amount);
    }

    const sorted = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category, amount]) => ({ category, amount }));

    for (const cat of excludedCategories) {
      if (totals[cat]) excluded += totals[cat];
    }

    return { categoryTotals: totals, topCategories: sorted, excludedAmount: excluded };
  }, [transactions, dateRange.startDate, dateRange.endDate, excludedCategories]);

  const analysisAdjusted = startingBalance + zohoIncome - Math.max(0, totalZohoExpenses - excludedAmount);

  const toggleCategory = (cat: string) => {
    setExcludedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <Card className="mt-3 border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-blue-700" />
            <h5 className="text-sm font-semibold text-blue-800">Conciliación Bancaria (Zoho)</h5>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-blue-600/80" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[260px]">Saldo inicial + ingresos Zoho - gastos del mes = dinero real en banco (solo Zoho).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setShowDetails((v) => !v)}
            >
              <ListTree className="h-3.5 w-3.5 mr-1" /> Detalle
            </Button>
            {onEditInitialBalance && (
              <Button
                variant="secondary"
                size="sm"
                className="h-8"
                onClick={onEditInitialBalance}
              >
                <Settings className="h-3.5 w-3.5 mr-1" /> Editar saldo inicial
              </Button>
            )}
          </div>
        </div>

        {/* Breakdown */}
        <div className="rounded-md bg-white/70 p-3 border border-blue-200">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-50 text-green-700 border border-green-200">
                  <Plus className="h-3 w-3" />
                </span>
                <span className="text-xs">Saldo inicial</span>
              </div>
              <span className="text-sm font-medium text-gray-800">{formatCurrency(startingBalance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-50 text-green-700 border border-green-200">
                  <Plus className="h-3 w-3" />
                </span>
                <span className="text-xs">Ingresos Zoho</span>
              </div>
              <span className="text-sm font-medium text-gray-800">{formatCurrency(zohoIncome)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-red-700 border border-red-200">
                  <Minus className="h-3 w-3" />
                </span>
                <span className="text-xs">Gastos del mes (Zoho)</span>
              </div>
              <span className="text-sm font-medium text-gray-800">{formatCurrency(totalZohoExpenses)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-blue-100 pt-2 mt-1">
              <div className="flex items-center gap-2 text-blue-800">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  <Equal className="h-3 w-3" />
                </span>
                <span className="text-xs font-semibold">Dinero real en banco</span>
              </div>
              <span className="text-sm font-bold text-blue-800">{formatCurrency(adjustedZohoIncome)}</span>
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-700" />
                <h6 className="text-sm font-semibold text-blue-800">Análisis por categoría (Zoho)</h6>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setShowCategoryFilters((v) => !v)}
              >
                {showCategoryFilters ? 'Ocultar filtros' : 'Exclusiones'}
              </Button>
            </div>

            {showCategoryFilters && (
              <div className="bg-white/70 p-3 rounded-md border border-blue-200">
                {topCategories.length === 0 ? (
                  <p className="text-xs text-gray-600">No hay datos de gastos por categoría para este período.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {topCategories.map(({ category, amount }) => {
                      const checked = excludedCategories.includes(category);
                      return (
                        <label key={category} className="flex items-center justify-between rounded-md border p-2 bg-white hover:bg-blue-50 transition">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={checked}
                              onChange={() => toggleCategory(category)}
                            />
                            <span className="text-xs text-gray-700">{category}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-800">{formatCurrency(amount)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {excludedAmount > 0 && (
              <div className="rounded-md bg-white/70 p-3 border border-amber-200">
                <p className="text-xs text-amber-700 mb-1">
                  Análisis con exclusiones: se excluyen {excludedCategories.length} categorías por un total de {formatCurrency(excludedAmount)}.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">Saldo inicial + Ingresos - (Gastos - Excluidos)</span>
                  <span className="text-sm font-semibold text-amber-700">{formatCurrency(analysisAdjusted)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BankReconciliation;
