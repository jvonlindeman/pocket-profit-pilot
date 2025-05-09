
/**
 * Creates a timeout promise for API calls
 * @param ms Timeout in milliseconds
 */
export const timeoutPromise = (ms: number) => new Promise((_, reject) => {
  setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
});

/**
 * Race a promise against a timeout
 * @param promise The promise to race
 * @param timeoutMs Timeout in milliseconds
 */
export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    timeoutPromise(timeoutMs)
  ]) as Promise<T>;
};

/**
 * Implements exponential backoff retry logic
 * @param operation Function to retry
 * @param retries Maximum number of retries
 * @param delay Initial delay in milliseconds
 * @param backoffFactor Factor to increase delay by each retry
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  backoffFactor: number = 2
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.log(`Retrying operation in ${delay}ms, ${retries} retries remaining`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithBackoff(
      operation,
      retries - 1,
      delay * backoffFactor,
      backoffFactor
    );
  }
};

/**
 * Safely parse JSON with error handling
 * @param text Text to parse as JSON
 * @returns Parsed object or null if parsing fails
 */
export const safeJSONParse = (text: string): any | null => {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse JSON:', err);
    return null;
  }
};
