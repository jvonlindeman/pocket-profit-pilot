
import { getRecentInteractions, registerInteraction } from './interactionStore';
import { calculateTransactionInsights, calculateMetricComparisons } from './dataAnalysis';
import { optimizeUIData } from './dataOptimization';
import { getVisibleComponents } from './domUtils';

// Function to register a visible section in the UI
export function registerVisibleSection(sectionName: string) {
  registerInteraction('visible-section', 'view', { section: sectionName });
  console.log(`Section registered as visible: ${sectionName}`);
}

// Main function to capture UI data for the financial assistant
export function captureUIData(financeContext: any) {
  const uiData: any = {};
  
  try {
    console.log('Capturing UI data from financial context');
    
    // Get components visible in the UI
    uiData.activeComponents = getVisibleComponents();
    
    // Get current date range if available
    if (financeContext?.dateRange) {
      uiData.currentDateRange = {
        startDate: financeContext.dateRange.startDate,
        endDate: financeContext.dateRange.endDate
      };
    }
    
    // Get financial summary if available
    if (financeContext?.financialData?.summary) {
      uiData.summary = financeContext.financialData.summary;
    }
    
    // Get transaction data (limit to 50 most recent for efficiency)
    if (financeContext?.financialData?.transactions) {
      uiData.transactions = financeContext.financialData.transactions
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50);
        
      // Generate insights from transactions
      uiData.transactionInsights = calculateTransactionInsights(uiData.transactions);
    }
    
    // Get income breakdown
    uiData.regularIncome = financeContext?.regularIncome || 0;
    uiData.stripeIncome = financeContext?.stripeIncome || 0;
    uiData.stripeFees = financeContext?.stripeFees || 0;
    uiData.stripeTransactionFees = financeContext?.stripeTransactionFees || 0;
    uiData.stripePayoutFees = financeContext?.stripePayoutFees || 0;
    uiData.stripeAdditionalFees = financeContext?.stripeAdditionalFees || 0;
    uiData.stripeNet = financeContext?.stripeNet || 0;
    uiData.stripeFeePercentage = financeContext?.stripeFeePercentage || 0;
    
    // Get collaborator expenses
    if (financeContext?.collaboratorExpenses) {
      uiData.collaboratorExpenses = financeContext.collaboratorExpenses;
    }
    
    // Get monthly balance info
    if (financeContext?.monthlyBalance) {
      uiData.monthlyBalance = financeContext.monthlyBalance;
    }
    if (financeContext?.startingBalance !== undefined) {
      uiData.startingBalance = financeContext.startingBalance;
    }
    
    // Calculate metric comparisons
    uiData.currentMetricComparisons = calculateMetricComparisons(financeContext);
    
    // Get past UI interactions
    uiData.interactionHistory = getRecentInteractions(15);
    
    // Get visible sections
    uiData.visibleSections = [];
    const sections = document.querySelectorAll('[data-component]');
    sections.forEach((section) => {
      const component = section.getAttribute('data-component');
      if (component && isElementInViewport(section)) {
        uiData.visibleSections.push(component);
      }
    });
    
    // Get focused element
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName !== 'BODY') {
      uiData.focusedElement = activeElement.tagName;
      if (activeElement.id) {
        uiData.focusedElement += `#${activeElement.id}`;
      } else if (activeElement.className) {
        uiData.focusedElement += `.${activeElement.className.split(' ')[0]}`;
      }
    }
    
    console.log('UI data captured successfully', { 
      components: uiData.activeComponents?.length || 0,
      transactions: uiData.transactions?.length || 0,
      insights: uiData.transactionInsights?.length || 0,
      interactions: uiData.interactionHistory?.length || 0
    });
    
    return uiData;
  } catch (err) {
    console.error('Error capturing UI data:', err);
    return uiData; // Return whatever data we managed to capture
  }
}

// Helper function to check if element is visible in viewport
function isElementInViewport(el: Element) {
  try {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= -100 && 
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 100 && 
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  } catch (err) {
    return false;
  }
}

// Register a UI interaction
export { registerInteraction, getRecentInteractions, optimizeUIData };
