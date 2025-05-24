
/**
 * Helper functions for DOM-related operations
 * Used by the UI data capture utilities
 */

// Function to get DOM elements by selector - exported for use in index.ts
export function getDOMElementsBySelector(selector: string): Element[] {
  try {
    return Array.from(document.querySelectorAll(selector));
  } catch (err) {
    console.error('Error getting DOM elements by selector:', err);
    return [];
  }
}

// Function to detect visible components in the DOM
export function getVisibleComponents(): string[] {
  try {
    const components: string[] = [];
    
    // Look for data-component attributes
    const elementsWithDataComponent = document.querySelectorAll('[data-component]');
    elementsWithDataComponent.forEach(element => {
      const componentName = element.getAttribute('data-component');
      if (componentName && isElementVisible(element)) {
        components.push(componentName);
      }
    });
    
    // Look for common component classes and IDs
    const possibleComponents = [
      { selector: '.financial-assistant-dialog', name: 'financial-assistant' },
      { selector: '.transaction-table', name: 'transaction-table' },
      { selector: '.expense-section', name: 'expenses' },
      { selector: '.income-tabs', name: 'income' },
      { selector: '.profit-section', name: 'profit' },
      { selector: '.summary-card-section', name: 'summary' },
      { selector: '.monthly-balance-editor', name: 'monthly-balance' },
      { selector: '.financial-history-summary', name: 'financial-history' }
    ];
    
    possibleComponents.forEach(({ selector, name }) => {
      const element = document.querySelector(selector);
      if (element && isElementVisible(element) && !components.includes(name)) {
        components.push(name);
      }
    });
    
    // Look for specific heading texts that might indicate visible components
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const componentKeywords: {[key: string]: string} = {
      'Resumen': 'summary',
      'Ingresos': 'income',
      'Gastos': 'expenses',
      'Beneficio': 'profit',
      'Transacciones': 'transactions',
      'Balance': 'balance'
    };
    
    headings.forEach(heading => {
      if (isElementVisible(heading)) {
        const text = heading.textContent || '';
        
        Object.entries(componentKeywords).forEach(([keyword, componentName]) => {
          if (text.includes(keyword) && !components.includes(componentName)) {
            components.push(componentName);
          }
        });
      }
    });
    
    return components;
  } catch (err) {
    console.error('Error detecting visible components:', err);
    return [];
  }
}

// Check if an element is visible
function isElementVisible(element: Element): boolean {
  try {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // Check if it's in viewport and has non-zero dimensions
    const isInViewport = 
      rect.top < windowHeight &&
      rect.bottom > 0 &&
      rect.left < windowWidth &&
      rect.right > 0;
    
    if (!isInViewport) return false;
    
    // Check computed styles
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    
    // Check parent visibility recursively
    let parent = element.parentElement;
    while (parent) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden' || parentStyle.opacity === '0') {
        return false;
      }
      parent = parent.parentElement;
    }
    
    return true;
  } catch (err) {
    console.error('Error checking element visibility:', err);
    return false;
  }
}

// Get text content from visible elements
export function getVisibleText(): string {
  try {
    const visibleElements = Array.from(document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, span, div'))
      .filter(element => isElementVisible(element) && element.textContent?.trim());
    
    return visibleElements
      .map(element => element.textContent?.trim())
      .filter(Boolean)
      .join(' ')
      .substring(0, 2000); // Limit length
  } catch (err) {
    console.error('Error getting visible text:', err);
    return '';
  }
}

// Get focused element details
export function getFocusedElement(): { type: string; id?: string; className?: string; text?: string } | null {
  try {
    const activeElement = document.activeElement;
    if (!activeElement || activeElement === document.body) return null;
    
    return {
      type: activeElement.tagName.toLowerCase(),
      id: activeElement.id || undefined,
      className: activeElement.className || undefined,
      text: activeElement.textContent?.trim() || undefined
    };
  } catch (err) {
    console.error('Error getting focused element:', err);
    return null;
  }
}
