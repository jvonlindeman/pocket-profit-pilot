
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import ZohoCallback from "./pages/ZohoCallback";
import NotFound from "./pages/NotFound";
import StripeManagement from "./pages/StripeManagement";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/zoho-callback" element={<ZohoCallback />} />
          <Route path="/stripe-management" element={<StripeManagement />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </TooltipProvider>
    </BrowserRouter>
  );
}

export default App;
