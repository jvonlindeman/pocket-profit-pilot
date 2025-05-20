
// Store for UI interactions
export const interactionStore: Array<{
  component: string;
  action: string;
  timestamp: string;
  details: any;
}> = [];

// Function to register a UI interaction
export function registerInteraction(component: string, action: string, details: any = {}) {
  const interaction = {
    component,
    action,
    timestamp: new Date().toISOString(),
    details
  };
  
  interactionStore.push(interaction);
  console.log('UI Interaction Registered:', interaction);
}

// Get recent interactions from the store
export function getRecentInteractions(limit: number = 10) {
  return interactionStore.slice(-limit); // Get the most recent interactions
}
