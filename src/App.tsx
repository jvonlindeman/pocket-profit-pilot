
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/toaster";
import { ApiCallsProvider } from "@/contexts/ApiCallsContext";
import { CacheProvider } from "@/contexts/CacheContext";
import { WebhookPreventionProvider } from "@/contexts/WebhookPreventionContext";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import ZohoCallback from "@/pages/ZohoCallback";
import { queryClient } from "@/lib/react-query/queryClient";
import "./App.css";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebhookPreventionProvider>
        <ApiCallsProvider>
          <CacheProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/zoho-callback" element={<ZohoCallback />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </Router>
            <ReactQueryDevtools initialIsOpen={false} />
          </CacheProvider>
        </ApiCallsProvider>
      </WebhookPreventionProvider>
    </QueryClientProvider>
  );
}

export default App;
