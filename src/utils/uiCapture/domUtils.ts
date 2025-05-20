
// Function to get active components in the UI
export function getActiveComponents() {
  const components = [
    'dashboard',
    'transactions',
    'summary',
    'reports',
    'settings',
    'financial-assistant'
  ];
  
  return components.filter(component => {
    const element = document.querySelector(`[data-component="${component}"]`);
    return element !== null && element.getBoundingClientRect().height > 0;
  });
}

// Function to get visible sections in the UI
export function getVisibleSections() {
  const sections = [
    'income',
    'expenses',
    'profit',
    'cashflow',
    'balance'
  ];
  
  return sections.filter(section => {
    const element = document.getElementById(section);
    return element !== null && element.getBoundingClientRect().height > 0;
  });
}

// Register a section as visible in the UI
export function registerVisibleSection(section: string) {
  // Register this section as visible for UI data capture
  console.log(`Section registered as visible: ${section}`);
  // We could store this in the interactionStore if needed
}

// Function to get the currently focused element
export function getFocusedElement() {
  return document.activeElement ? document.activeElement.tagName : null;
}
