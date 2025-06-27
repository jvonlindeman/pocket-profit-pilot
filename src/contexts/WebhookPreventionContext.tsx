
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WebhookPreventionContextType {
  webhooksDisabled: boolean;
  disableWebhooks: () => void;
  enableWebhooks: () => void;
  withWebhooksDisabled: <T>(fn: () => Promise<T>) => Promise<T>;
}

const WebhookPreventionContext = createContext<WebhookPreventionContextType | undefined>(undefined);

export function WebhookPreventionProvider({ children }: { children: ReactNode }) {
  const [webhooksDisabled, setWebhooksDisabled] = useState(false);

  const disableWebhooks = () => {
    console.log("🚫 WEBHOOKS DISABLED - No API calls should be made");
    setWebhooksDisabled(true);
  };

  const enableWebhooks = () => {
    console.log("✅ WEBHOOKS ENABLED - API calls can be made");
    setWebhooksDisabled(false);
  };

  const withWebhooksDisabled = async <T,>(fn: () => Promise<T>): Promise<T> => {
    const wasDisabled = webhooksDisabled;
    disableWebhooks();
    try {
      return await fn();
    } finally {
      if (!wasDisabled) {
        enableWebhooks();
      }
    }
  };

  return (
    <WebhookPreventionContext.Provider value={{
      webhooksDisabled,
      disableWebhooks,
      enableWebhooks,
      withWebhooksDisabled
    }}>
      {children}
    </WebhookPreventionContext.Provider>
  );
}

export function useWebhookPrevention() {
  const context = useContext(WebhookPreventionContext);
  if (!context) {
    throw new Error('useWebhookPrevention must be used within a WebhookPreventionProvider');
  }
  return context;
}
