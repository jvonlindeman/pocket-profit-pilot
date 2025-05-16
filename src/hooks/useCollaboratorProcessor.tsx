
import { useCallback, useState, useEffect } from 'react';
import { CategorySummary } from '@/types/financial';
import { excludedVendors } from '@/services/zoho/api/config';

export const useCollaboratorProcessor = () => {
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<CategorySummary[]>([]);

  // Función para procesar datos de colaboradores
  const processCollaboratorData = useCallback((rawResponse: any) => {
    console.log("Processing collaborator data from raw response:", rawResponse);
    
    if (!rawResponse || !rawResponse.colaboradores || !Array.isArray(rawResponse.colaboradores)) {
      console.warn("No valid collaborator data found in raw response");
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
    
    console.log("Valid collaborators after filtering:", validCollaborators);
      
    // Agrupar colaboradores por nombre y sumar sus montos
    const collaboratorMap = validCollaborators.reduce((acc: Record<string, number>, item: any) => {
      const vendorName = item.vendor_name;
      acc[vendorName] = (acc[vendorName] || 0) + Number(item.total);
      return acc;
    }, {});
    
    console.log("Grouped collaborator expenses:", collaboratorMap);
    
    // Convertir el mapa agrupado a un array de objetos
    const groupedCollaborators = Object.entries(collaboratorMap)
      .map(([name, amount]) => ({
        category: name,
        amount: Number(amount),
        percentage: 0 // We'll calculate this below
      }))
      .filter((item: any) => item.amount > 0);
      
    // Calcular el total
    const totalAmount = groupedCollaborators.reduce((sum: number, item: any) => sum + item.amount, 0);
    
    console.log("Total collaborator expense:", totalAmount);
    
    // Calcular porcentajes y formatear para el gráfico
    const formattedData = groupedCollaborators.map((item: any) => ({
      category: item.name || item.category,
      amount: item.amount,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
    })).sort((a: any, b: any) => b.amount - a.amount);
    
    console.log("Final formatted collaborator data:", formattedData);
    
    setCollaboratorExpenses(formattedData);
    return formattedData;
  }, []);

  return {
    collaboratorExpenses,
    processCollaboratorData
  };
};
