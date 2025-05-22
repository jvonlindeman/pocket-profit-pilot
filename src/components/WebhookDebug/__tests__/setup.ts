
// Test setup file for WebhookDebug components
// This file adds common setup functionality for the WebhookDebug component tests

// Extend global expect with testing-library matchers if needed
// Add any global mocks or setup needed for tests

// Define a helper function to check if a data section is visible
export const isDataSectionVisible = (section: string): boolean => {
  const element = document.querySelector(`[data-testid="${section}-section"]`);
  return element !== null && element.classList.contains('visible');
};

// Add any other helper functions or mocks that would be useful across tests
export const mockDateRange = {
  from: new Date('2025-05-01'),
  to: new Date('2025-05-31')
};
