
// Function to optimize UI data for transmission
export function optimizeUIData(uiData: any) {
  try {
    // Create a copy to avoid modifying the original
    const optimized = {...uiData};
    
    // Limit transaction data
    if (optimized.transactions && optimized.transactions.length > 15) {
      optimized.transactions = optimized.transactions.slice(0, 15);
    }
    
    // Only include necessary interaction history
    if (optimized.interactionHistory && optimized.interactionHistory.length > 10) {
      optimized.interactionHistory = optimized.interactionHistory.slice(0, 10);
    }
    
    // Remove any large or unnecessary fields
    if (optimized.rawData) delete optimized.rawData;
    
    return optimized;
  } catch (error) {
    console.error("Error optimizing UI data:", error);
    return uiData; // Return original if optimization fails
  }
}
