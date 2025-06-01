
import { useCallback, useState, useEffect } from 'react';
import { CategorySummary } from '@/types/financial';
import { excludedVendors } from '@/services/zoho/api/config';
import { validateFinancialValue } from '@/utils/financialUtils';

// Expanded collaborator identifiers for better detection
const COLLABORATOR_IDENTIFIERS = [
  'colaborador', 'colaboradores',
  'freelancer', 'freelancers', 
  'contractor', 'contractors',
  'consultant', 'consultants',
  'colaboracion', 'colaborativo',
  'external', 'externo', 'externos',
  'partner', 'socio', 'socios',
  'vendor', 'proveedor', 'proveedores'
];

// Enhanced function to detect if a vendor is likely a collaborator
const isLikelyCollaborator = (vendorName: string, description?: string): boolean => {
  const searchText = `${vendorName} ${description || ''}`.toLowerCase();
  
  return COLLABORATOR_IDENTIFIERS.some(identifier => 
    searchText.includes(identifier)
  );
};

export const useCollaboratorProcessor = () => {
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<CategorySummary[]>([]);
  const [debugInfo, setDebugInfo] = useState<{
    totalProcessed: number;
    excluded: number;
    identified: number;
    potentialMissed: string[];
  }>({
    totalProcessed: 0,
    excluded: 0,
    identified: 0,
    potentialMissed: []
  });

  // Function to process collaborator data with enhanced detection
  const processCollaboratorData = useCallback((rawResponse: any) => {
    if (!rawResponse || !rawResponse.colaboradores || !Array.isArray(rawResponse.colaboradores)) {
      console.warn("⚠️ CollaboratorProcessor: No valid collaborator data found in raw response");
      setCollaboratorExpenses([]);
      setDebugInfo({
        totalProcessed: 0,
        excluded: 0,
        identified: 0,
        potentialMissed: []
      });
      return [];
    }

    const allCollaborators = rawResponse.colaboradores;
    let excludedCount = 0;
    let identifiedCount = 0;
    const potentialMissed: string[] = [];

    // Enhanced filtering and processing
    const validCollaborators = allCollaborators
      .filter((item: any) => {
        // Basic validation
        if (!item || typeof item.total === 'undefined' || !item.vendor_name) {
          return false;
        }

        const vendorName = item.vendor_name;
        const amount = validateFinancialValue(item.total);

        // Check if excluded
        if (excludedVendors.includes(vendorName)) {
          excludedCount++;
          return false;
        }

        // Check if amount is valid
        if (amount <= 0) {
          return false;
        }

        // Enhanced collaborator detection
        const isCollaborator = isLikelyCollaborator(vendorName, item.description);
        
        if (isCollaborator) {
          identifiedCount++;
        } else {
          potentialMissed.push(`${vendorName} ($${amount})`);
        }

        return true; // Include all valid items, not just identified collaborators
      });
      
    // Group collaborators by name and sum their amounts
    const collaboratorMap = validCollaborators.reduce((acc: Record<string, number>, item: any) => {
      const vendorName = item.vendor_name;
      const amount = validateFinancialValue(item.total);
      
      if (amount > 0) {
        acc[vendorName] = (acc[vendorName] || 0) + amount;
      }
      
      return acc;
    }, {});
    
    // Convert the grouped map to an array of CategorySummary objects
    const groupedCollaborators = Object.entries(collaboratorMap)
      .map(([name, amount]) => ({
        category: name,
        amount: validateFinancialValue(amount),
        percentage: 0 // We'll calculate this below
      }))
      .filter(item => item.amount > 0);
      
    // Calculate the total
    const totalAmount = groupedCollaborators.reduce(
      (sum, item) => sum + validateFinancialValue(item.amount), 0
    );
    
    // Calculate percentages and format for the chart
    const formattedData = groupedCollaborators.map(item => ({
      category: item.category,
      amount: validateFinancialValue(item.amount),
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);

    // Update debug info
    setDebugInfo({
      totalProcessed: allCollaborators.length,
      excluded: excludedCount,
      identified: identifiedCount,
      potentialMissed
    });
    
    setCollaboratorExpenses(formattedData);
    return formattedData;
  }, []);

  // Log debug info when it changes
  useEffect(() => {
    if (debugInfo.totalProcessed > 0 && debugInfo.potentialMissed.length > 0) {
      console.warn("⚠️ CollaboratorProcessor: Potential missed collaborators:", debugInfo.potentialMissed);
    }
  }, [debugInfo]);

  return {
    collaboratorExpenses,
    processCollaboratorData,
    debugInfo
  };
};
