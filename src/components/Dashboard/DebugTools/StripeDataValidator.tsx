
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Database, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { StripeDataManager } from '@/utils/stripeDataManager';
import { toast } from "@/hooks/use-toast";

export default function StripeDataValidator() {
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [summary, setSummary] = useState<any[]>([]);

  const handleForceRefresh = async () => {
    setLoading(true);
    try {
      console.log(`Testing force refresh for ${year}/${month}`);
      
      const result = await StripeDataManager.forceRefreshMonth(year, month);
      
      setValidationResult(result);
      
      if (result.success) {
        toast({
          title: "Éxito",
          description: `Se almacenaron ${result.transactionCount} transacciones de Stripe para ${year}/${month}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al almacenar datos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing force refresh:", error);
      toast({
        title: "Error",
        description: "Error durante la prueba",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetSummary = async () => {
    setLoading(true);
    try {
      const summaryData = await StripeDataManager.getCachedDataSummary();
      setSummary(summaryData);
      
      toast({
        title: "Resumen actualizado",
        description: `Se verificaron ${summaryData.length} meses`,
      });
    } catch (error) {
      console.error("Error getting summary:", error);
      toast({
        title: "Error",
        description: "Error al obtener el resumen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          Validador de Datos Stripe
        </CardTitle>
        <CardDescription>
          Herramienta para probar y validar el almacenamiento de datos Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Force Refresh Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Forzar Recarga y Almacenamiento</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="2020"
                max="2030"
              />
            </div>
            <div>
              <Label htmlFor="month">Mes</Label>
              <Input
                id="month"
                type="number"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                min="1"
                max="12"
              />
            </div>
          </div>
          <Button 
            onClick={handleForceRefresh} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Forzar Recarga {year}/{month}</>
            )}
          </Button>
          
          {validationResult && (
            <div className={`p-4 rounded-lg border ${
              validationResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {validationResult.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {validationResult.success ? 'Éxito' : 'Error'}
                </span>
              </div>
              <p className="mt-1">
                {validationResult.success 
                  ? `Se almacenaron ${validationResult.transactionCount} transacciones`
                  : validationResult.error
                }
              </p>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Resumen de Datos Cacheados</h3>
            <Button 
              onClick={handleGetSummary} 
              variant="outline"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Actualizar Resumen
            </Button>
          </div>
          
          {summary.length > 0 && (
            <div className="space-y-2">
              {summary.map((item, index) => (
                <div 
                  key={index}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    item.hasData 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="font-medium">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {item.transactionCount} transacciones
                    </span>
                    {item.hasData ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
