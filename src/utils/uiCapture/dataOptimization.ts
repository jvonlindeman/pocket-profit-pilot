/**
 * This utility optimizes UI data before sending it to the edge function
 * to reduce payload size and improve performance
 */

// Optimize UI data for transmission
export function optimizeUIData(uiData: any) {
  try {
    if (!uiData) return {};
    
    // Create a copy to avoid modifying the original
    const optimized = { ...uiData };
    
    // Optimize transaction data (limit to necessary fields and truncate descriptions)
    if (optimized.transactions && optimized.transactions.length > 0) {
      optimized.transactions = optimized.transactions.map((tx: any) => ({
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
        description: truncateString(tx.description, 100),
        category: tx.category,
        type: tx.type,
        source: tx.source
      }));
    }
    
    // Optimize collaborator expenses (limit to necessary fields)
    if (optimized.collaboratorExpenses && optimized.collaboratorExpenses.length > 0) {
      optimized.collaboratorExpenses = optimized.collaboratorExpenses.map((exp: any) => ({
        category: exp.category,
        amount: exp.amount,
        percentage: exp.percentage
      }));
    }
    
    // Keep only essential interaction data
    if (optimized.interactionHistory && optimized.interactionHistory.length > 0) {
      optimized.interactionHistory = optimized.interactionHistory.map((interaction: any) => ({
        component: interaction.component,
        action: interaction.action,
        timestamp: interaction.timestamp
      }));
    }
    
    // Remove any null or undefined values
    Object.keys(optimized).forEach(key => {
      if (optimized[key] === null || optimized[key] === undefined) {
        delete optimized[key];
      }
    });
    
    return optimized;
  } catch (err) {
    console.error('Error optimizing UI data:', err);
    return uiData || {}; // Return original data if optimization fails
  }
}

// Helper function to truncate strings
function truncateString(str: string | null | undefined, maxLength: number): string {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}
