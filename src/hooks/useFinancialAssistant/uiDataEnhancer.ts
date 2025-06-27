
import { StoredFinancialSnapshot } from '@/services/financialDataStorage';

export class UIDataEnhancer {
  static enhance(
    uiData: any,
    storedSnapshot: StoredFinancialSnapshot | null,
    latestSnapshot: StoredFinancialSnapshot | null,
    formatForGPT: (snapshot: StoredFinancialSnapshot) => string
  ): any {
    let enhancedUIData: any = { ...uiData };
    
    // Try to use specific snapshot first
    if (storedSnapshot) {
      console.log('📁 Using stored financial data for current date range');
      enhancedUIData.storedFinancialData = formatForGPT(storedSnapshot);
      enhancedUIData.dataSource = 'stored_snapshot';
    }
    // Fall back to latest snapshot
    else if (latestSnapshot) {
      console.log('📁 Using latest stored financial data snapshot');
      enhancedUIData.storedFinancialData = formatForGPT(latestSnapshot);
      enhancedUIData.dataSource = 'latest_snapshot';
    }
    
    console.log('Enhanced UI data with stored financial data:', {
      activeComponents: enhancedUIData.activeComponents,
      hasSummary: Boolean(enhancedUIData.summary),
      transactionCount: enhancedUIData.transactions?.length || 0,
      hasStoredData: Boolean(enhancedUIData.storedFinancialData),
      dataSource: enhancedUIData.dataSource,
    });
    
    return enhancedUIData;
  }
}
