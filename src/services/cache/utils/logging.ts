
/**
 * Log error with context
 * @param message Error message
 * @param error Error object
 */
export function logError(message: string, error: any): void {
  console.error(`Error: ${message}:`, error);
}
