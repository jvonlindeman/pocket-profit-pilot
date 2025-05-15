
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { CacheProvider } from '@/contexts/CacheContext';
import { useFinancialDateRange } from './hooks/useFinancialDateRange';

// Import your components
import ZohoDebug from './components/ZohoDebug';
import ZohoConfig from './components/ZohoConfig';
import StripeDebug from './components/StripeDebug';
import WebhookRequestDebug from './components/WebhookRequestDebug';
import WebhookDebug from './components/WebhookDebug';
import Index from './pages/Index';

import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Wrapper components to provide the required props
const StripeDebugWrapper = () => {
  const { dateRange } = useFinancialDateRange();
  return <StripeDebug dateRange={dateRange} />;
};

const WebhookRequestDebugWrapper = () => {
  const { dateRange } = useFinancialDateRange();
  return <WebhookRequestDebug dateRange={dateRange} />;
};

const WebhookDebugWrapper = () => {
  const { dateRange } = useFinancialDateRange();
  return <WebhookDebug dateRange={dateRange} />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CacheProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/zoho" element={<ZohoDebug />} />
            <Route path="/zoho/config" element={<ZohoConfig />} />
            <Route path="/stripe" element={<StripeDebugWrapper />} />
            <Route path="/webhook-request" element={<WebhookRequestDebugWrapper />} />
            <Route path="/webhook" element={<WebhookDebugWrapper />} />
          </Routes>
          <Toaster />
        </Router>
      </CacheProvider>
    </QueryClientProvider>
  );
}

export default App;
