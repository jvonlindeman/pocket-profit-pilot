
/**
 * Log an error with context
 */
export function logError(context: string, message: string, error: any): void {
  console.error(`[${context}] ${message}:`, error);
}
