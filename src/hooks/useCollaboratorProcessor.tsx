
import { useCallback, useState, useEffect } from 'react';
import { CategorySummary } from '@/types/financial';
import { excludedVendors } from '@/services/zoho/api/config';

export const useCollaboratorProcessor = () => {
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<CategorySummary[]>([]);

  // Function to process collaborator data
  const processCollaboratorData = useCallback((rawResponse: any) => {
    console.log("Processing collaborator data from raw response:", rawResponse);
    
    if (!rawResponse || !rawResponse.colaboradores || !Array.isArray(rawResponse.colaboradores)) {
      console.warn("No valid collaborator data found in raw response");
      setCollaboratorExpenses([]);
      return [];
    }

    // Filter out invalid collaborator data and excluded vendors
    const validCollaborators = rawResponse.colaboradores
      .filter((item: any) => 
        item && 
        typeof item.total !== 'undefined' && 
        item.vendor_name && 
        !excludedVendors.includes(item.vendor_name)
      );
    
    console.log("Valid collaborators after filtering:", validCollaborators);
      
    // Group collaborators by name and sum their amounts
    const collaboratorMap = validCollaborators.reduce((acc: Record<string, number>, item: any) => {
      const vendorName = item.vendor_name;
      const amount = Number(item.total);
      
      // Only add valid amounts
      if (!isNaN(amount) && amount > 0) {
        acc[vendorName] = (acc[vendorName] || 0) + amount;
        console.log(`Adding collaborator: ${vendorName} - $${amount}`);
      }
      
      return acc;
    }, {});
    
    console.log("Grouped collaborator expenses:", collaboratorMap);
    
    // Convert the grouped map to an array of CategorySummary objects
    const groupedCollaborators = Object.entries(collaboratorMap)
      .map(([name, amount]) => ({
        category: name,
        amount: Number(amount),
        percentage: 0 // We'll calculate this below
      }))
      .filter(item => item.amount > 0);
      
    // Calculate the total
    const totalAmount = groupedCollaborators.reduce((sum, item) => sum + item.amount, 0);
    
    console.log("Total collaborator expense:", totalAmount);
    
    // Calculate percentages and format for the chart
    const formattedData = groupedCollaborators.map(item => ({
      category: item.category,
      amount: item.amount,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
    
    console.log("Final formatted collaborator data:", formattedData);
    
    setCollaboratorExpenses(formattedData);
    return formattedData;
  }, []);

  return {
    collaboratorExpenses,
    processCollaboratorData
  };
};
