
import { useCallback, useState } from 'react';

export const useCollaboratorProcessor = () => {
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<any[]>([]);

  // Función para procesar datos de colaboradores
  const processCollaboratorData = useCallback((rawResponse: any) => {
    if (!rawResponse || !rawResponse.colaboradores || !Array.isArray(rawResponse.colaboradores)) {
      setCollaboratorExpenses([]);
      return [];
    }

    // Lista de proveedores que deben ser excluidos
    const excludedVendors = ["Johan von Lindeman", "DFC Panama"];

    // Filtrar colaboradores con datos válidos y excluir los proveedores especificados
    const validCollaborators = rawResponse.colaboradores
      .filter((item: any) => 
        item && 
        typeof item.total !== 'undefined' && 
        item.vendor_name && 
        !excludedVendors.includes(item.vendor_name)
      )
      .map((item: any) => ({
        name: item.vendor_name,
        amount: Number(item.total)
      }))
      .filter((item: any) => item.amount > 0);

    // Calcular el total
    const totalAmount = validCollaborators.reduce((sum: number, item: any) => sum + item.amount, 0);
    
    // Calcular porcentajes y formatear para el gráfico
    const formattedData = validCollaborators.map((item: any) => ({
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
