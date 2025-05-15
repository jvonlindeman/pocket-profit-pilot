
import { useCallback, useState, useEffect } from 'react';
import { CategorySummary } from '@/types/financial';
import { excludedVendors } from '@/services/zoho/api/config';

export const useCollaboratorProcessor = () => {
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<CategorySummary[]>([]);

  // Add effect to log changes to collaborator expenses
  useEffect(() => {
    console.log("Collaborator expenses updated:", {
      count: collaboratorExpenses.length,
      totalAmount: collaboratorExpenses.reduce((sum, item) => sum + item.amount, 0),
      expenses: collaboratorExpenses
    });
  }, [collaboratorExpenses]);

  // Function to process collaborator data
  const processCollaboratorData = useCallback((rawResponse: any) => {
    console.log("Processing collaborator data from raw response:", rawResponse);
    
    if (!rawResponse || !rawResponse.colaboradores || !Array.isArray(rawResponse.colaboradores)) {
      console.warn("No valid collaborator data found in response");
      setCollaboratorExpenses([]);
      return [];
    }

    // Filter collaborators with valid data and exclude specified vendors
    const validCollaborators = rawResponse.colaboradores
      .filter((item: any) => 
        item && 
        typeof item.total !== 'undefined' && 
        item.vendor_name && 
        !excludedVendors.includes(item.vendor_name)
      );
      
    console.log("Valid collaborators found:", validCollaborators.length);
    
    // Group collaborators by name and sum their amounts
    const collaboratorMap = validCollaborators.reduce((acc: Record<string, number>, item: any) => {
      const vendorName = item.vendor_name;
      acc[vendorName] = (acc[vendorName] || 0) + Number(item.total);
      return acc;
    }, {});
    
    // Convert the grouped map to an array of objects
    const groupedCollaborators = Object.entries(collaboratorMap)
      .map(([name, amount]) => ({
        name,
        amount: Number(amount)
      }))
      .filter((item: any) => item.amount > 0);
      
    // Calculate total amount
    const totalAmount = groupedCollaborators.reduce((sum: number, item: any) => sum + item.amount, 0);
    
    // Calculate percentages and format for chart display
    const formattedData = groupedCollaborators.map((item: any) => ({
      category: item.name,
      amount: item.amount,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
    })).sort((a: any, b: any) => b.amount - a.amount);
    
    console.log("Processed collaborator expenses:", {
      count: formattedData.length,
      totalAmount,
      first3Items: formattedData.slice(0, 3) 
    });
    
    setCollaboratorExpenses(formattedData);
    return formattedData;
  }, []);

  return {
    collaboratorExpenses,
    processCollaboratorData
  };
};
