
import { useCallback, useState } from 'react';
import { excludedVendors } from '@/services/zoho/api/config';

export const useCollaboratorProcessor = () => {
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<any[]>([]);

  // Función para procesar datos de colaboradores
  const processCollaboratorData = useCallback((rawResponse: any) => {
    if (!rawResponse || !rawResponse.colaboradores || !Array.isArray(rawResponse.colaboradores)) {
      setCollaboratorExpenses([]);
      return [];
    }

    // Filtrar colaboradores con datos válidos y excluir los proveedores especificados
    const validCollaborators = rawResponse.colaboradores
      .filter((item: any) => 
        item && 
        typeof item.total !== 'undefined' && 
        item.vendor_name && 
        !excludedVendors.includes(item.vendor_name)
      );
      
    // Agrupar colaboradores por nombre y sumar sus montos
    const collaboratorMap = validCollaborators.reduce((acc: Record<string, number>, item: any) => {
      const vendorName = item.vendor_name;
      acc[vendorName] = (acc[vendorName] || 0) + Number(item.total);
      return acc;
    }, {});
    
    // Convertir el mapa agrupado a un array de objetos
    const groupedCollaborators = Object.entries(collaboratorMap)
      .map(([name, amount]) => ({
        name,
        amount: Number(amount)
      }))
      .filter((item: any) => item.amount > 0);
      
    // Calcular el total
    const totalAmount = groupedCollaborators.reduce((sum: number, item: any) => sum + item.amount, 0);
    
    // Calcular porcentajes y formatear para el gráfico
    const formattedData = groupedCollaborators.map((item: any) => ({
      category: item.name,
      amount: item.amount,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
    })).sort((a: any, b: any) => b.amount - a.amount);
    
    setCollaboratorExpenses(formattedData);
    return formattedData;
  }, []);

  return {
    collaboratorExpenses,
    processCollaboratorData
  };
};

