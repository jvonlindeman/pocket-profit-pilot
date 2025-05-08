
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
