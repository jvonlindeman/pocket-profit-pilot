
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Simplified hook to track refresh status without circuit breaker complexity
 */
export function useRefreshStatus() {
  // Track if a refresh is in progress
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const { toast } = useToast();

  // Start a refresh operation
  const startRefresh = useCallback(() => {
    if (isRefreshing) {
      console.log('⚠️ Refresh already in progress, skipping request');
      return false;
    }

    // Set refreshing state
    setIsRefreshing(true);
    
    // Set a safety timeout to reset the isRefreshing flag after 30s
    // in case the endRefresh is never called due to an error
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      console.warn('🚨 Refresh operation timed out after 30s, resetting state');
      setIsRefreshing(false);
    }, 30000);
    
    return true;
  }, [isRefreshing]);

  // End a refresh operation
  const endRefresh = useCallback((error: Error | null = null) => {
    // Clear the safety timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    setIsRefreshing(false);
    
    if (error) {
      setLastError(error);
      setErrorCount(prev => prev + 1);
    } else {
      // Only reset error count on successful operations
      if (errorCount > 0) {
        setErrorCount(0);
      }
    }
  }, [errorCount]);

  // Reset all state
  const resetRefreshState = useCallback(() => {
    console.log('🔄 Resetting refresh state');
    
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    setIsRefreshing(false);
    setLastError(null);
    setErrorCount(0);
    
    toast({
      title: "Estado de actualización restablecido",
      description: "Se ha restablecido el estado de actualización de datos",
    });
  }, [toast]);

  // Emergency recovery for stuck states
  const emergencyRecovery = useCallback(() => {
    console.log('🚨 EMERGENCY RECOVERY - Forcing reset of refresh state');
    
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    setIsRefreshing(false);
    setLastError(null);
    setErrorCount(0);
    
    toast({
      title: "Recuperación de emergencia completada",
      description: "Se han restablecido todos los estados de actualización",
    });
    
    return true;
  }, [toast]);

  return {
    isRefreshing,
    startRefresh,
    endRefresh,
    resetRefreshState,
    emergencyRecovery,
    lastError,
    hasErrors: errorCount > 0,
    errorCount
  };
}
