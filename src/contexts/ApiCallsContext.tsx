
import React, { createContext, useContext, useState, useCallback } from 'react';

interface ApiCallsContextType {
  zohoApiCalls: number;
  stripeApiCalls: number;
  webhookCallsCount: number;
  incrementZohoApiCalls: () => void;
  incrementStripeApiCalls: () => void;
  updateWebhookCallsCount: (count: number) => void;
  resetApiCalls: () => void;
  getTotalApiCalls: () => number;
}

const ApiCallsContext = createContext<ApiCallsContextType | undefined>(undefined);

export const ApiCallsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [zohoApiCalls, setZohoApiCalls] = useState(0);
  const [stripeApiCalls, setStripeApiCalls] = useState(0);
  const [webhookCallsCount, setWebhookCallsCount] = useState(0);

  const incrementZohoApiCalls = useCallback(() => {
    setZohoApiCalls(prev => prev + 1);
  }, []);

  const incrementStripeApiCalls = useCallback(() => {
    setStripeApiCalls(prev => prev + 1);
  }, []);

  const updateWebhookCallsCount = useCallback((count: number) => {
    console.log(`🔢 ApiCallsContext: Updating webhook calls count to ${count}`);
    setWebhookCallsCount(count);
  }, []);

  const resetApiCalls = useCallback(() => {
    setZohoApiCalls(0);
    setStripeApiCalls(0);
    setWebhookCallsCount(0);
  }, []);

  const getTotalApiCalls = useCallback(() => {
    return zohoApiCalls + stripeApiCalls;
  }, [zohoApiCalls, stripeApiCalls]);

  return (
    <ApiCallsContext.Provider value={{
      zohoApiCalls,
      stripeApiCalls,
      webhookCallsCount,
      incrementZohoApiCalls,
      incrementStripeApiCalls,
      updateWebhookCallsCount,
      resetApiCalls,
      getTotalApiCalls
    }}>
      {children}
    </ApiCallsContext.Provider>
  );
};

export const useApiCalls = () => {
  const context = useContext(ApiCallsContext);
  if (context === undefined) {
    throw new Error('useApiCalls must be used within an ApiCallsProvider');
  }
  return context;
};
