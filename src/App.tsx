
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CacheProvider } from "./contexts/CacheContext";
import { ApiCallsProvider } from "./contexts/ApiCallsContext";
import { FinancialAssistantButton } from "./components/FinancialAssistant/FinancialAssistantButton";
import { queryClient } from "./lib/react-query/queryClient";
import { QueryDevTools } from "./components/ReactQueryDevTools";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

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
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FinancialAssistantButton />
            <QueryDevTools />
          </ApiCallsProvider>
        </CacheProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
