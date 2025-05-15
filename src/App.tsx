
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { CacheProvider } from '@/contexts/CacheContext';

// Import your components
import ZohoDebug from './components/ZohoDebug';
import ZohoConfig from './components/ZohoConfig';
import StripeDebug from './components/StripeDebug';
import WebhookRequestDebug from './components/WebhookRequestDebug';
import WebhookDebug from './components/WebhookDebug';
import FinanceDashboard from './components/Dashboard/FinanceDashboard';

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CacheProvider>
        <Router>
          <Routes>
            <Route path="/" element={<FinanceDashboard />} />
            <Route path="/zoho" element={<ZohoDebug />} />
            <Route path="/zoho/config" element={<ZohoConfig />} />
            <Route path="/stripe" element={<StripeDebug />} />
            <Route path="/webhook-request" element={<WebhookRequestDebug />} />
            <Route path="/webhook" element={<WebhookDebug />} />
          </Routes>
          <Toaster />
        </Router>
      </CacheProvider>
    </QueryClientProvider>
  );
}

export default App;
