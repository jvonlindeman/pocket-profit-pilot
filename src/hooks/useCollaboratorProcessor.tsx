
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
    console.log("🔍 CollaboratorProcessor: Starting enhanced processing", {
      rawResponse: !!rawResponse,
      colaboradoresArray: Array.isArray(rawResponse?.colaboradores),
      colaboradoresCount: rawResponse?.colaboradores?.length || 0
    });
    
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

    console.log(`📊 CollaboratorProcessor: Processing ${allCollaborators.length} total collaborator entries`);

    // Enhanced filtering and processing
    const validCollaborators = allCollaborators
      .filter((item: any) => {
        // Basic validation
        if (!item || typeof item.total === 'undefined' || !item.vendor_name) {
          console.log("❌ CollaboratorProcessor: Invalid item (missing total or vendor_name)", item);
          return false;
        }

        const vendorName = item.vendor_name;
        const amount = validateFinancialValue(item.total);

        // Check if excluded
        if (excludedVendors.includes(vendorName)) {
          console.log(`🚫 CollaboratorProcessor: Excluded vendor: ${vendorName} ($${amount})`);
          excludedCount++;
          return false;
        }

        // Check if amount is valid
        if (amount <= 0) {
          console.log(`💰 CollaboratorProcessor: Invalid amount for ${vendorName}: $${amount}`);
          return false;
        }

        // Enhanced collaborator detection
        const isCollaborator = isLikelyCollaborator(vendorName, item.description);
        
        if (isCollaborator) {
          console.log(`✅ CollaboratorProcessor: Identified collaborator: ${vendorName} - $${amount}`);
          identifiedCount++;
        } else {
          console.log(`❓ CollaboratorProcessor: Potential missed collaborator: ${vendorName} - $${amount}`);
          potentialMissed.push(`${vendorName} ($${amount})`);
        }

        return true; // Include all valid items, not just identified collaborators
      });
    
    console.log(`📈 CollaboratorProcessor: Filtering results:`, {
      total: allCollaborators.length,
      valid: validCollaborators.length,
      excluded: excludedCount,
      identified: identifiedCount,
      potentialMissed: potentialMissed.length
    });
      
    // Group collaborators by name and sum their amounts
    const collaboratorMap = validCollaborators.reduce((acc: Record<string, number>, item: any) => {
      const vendorName = item.vendor_name;
      const amount = validateFinancialValue(item.total);
      
      if (amount > 0) {
        acc[vendorName] = (acc[vendorName] || 0) + amount;
        console.log(`💼 CollaboratorProcessor: Adding to map: ${vendorName} - $${amount} (total: $${acc[vendorName]})`);
      }
      
      return acc;
    }, {});
    
    console.log("🗂️ CollaboratorProcessor: Grouped collaborator map:", collaboratorMap);
    
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
    
    console.log(`💵 CollaboratorProcessor: Total collaborator expense: $${totalAmount}`);
    
    // Calculate percentages and format for the chart
    const formattedData = groupedCollaborators.map(item => ({
      category: item.category,
      amount: validateFinancialValue(item.amount),
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
    
    console.log("📊 CollaboratorProcessor: Final formatted collaborator data:", {
      count: formattedData.length,
      total: totalAmount,
      items: formattedData
    });

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
    if (debugInfo.totalProcessed > 0) {
      console.log("🔍 CollaboratorProcessor: Debug Summary:", debugInfo);
      
      if (debugInfo.potentialMissed.length > 0) {
        console.warn("⚠️ CollaboratorProcessor: Potential missed collaborators:", debugInfo.potentialMissed);
      }
    }
  }, [debugInfo]);

  return {
    collaboratorExpenses,
    processCollaboratorData,
    debugInfo
  };
};
