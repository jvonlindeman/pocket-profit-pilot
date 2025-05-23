
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CacheProvider } from "./contexts/CacheContext";
import { ApiCallsProvider } from "./contexts/ApiCallsContext";
import { FinancialAssistantButton } from "./components/FinancialAssistant/FinancialAssistantButton";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ZohoCallback from "./pages/ZohoCallback";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <CacheProvider>
          <ApiCallsProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/zoho/callback" element={<ZohoCallback />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FinancialAssistantButton />
          </ApiCallsProvider>
        </CacheProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
