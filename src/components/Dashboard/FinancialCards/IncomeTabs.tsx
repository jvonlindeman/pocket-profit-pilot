
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StripeIncomeTab from './StripeTabs/StripeIncomeTab';
import ZohoIncomeTab from './StripeTabs/ZohoIncomeTab';
import CombinedFinanceTab from './StripeTabs/CombinedFinanceTab';

const IncomeTabs: React.FC = () => {
  // Track active tab for possible performance optimizations
  const [activeTab, setActiveTab] = useState('stripe');

  // Safe logging - no data fetching
  useEffect(() => {
    console.log('📊 IncomeTabs: Component mounted/updated (DISPLAY ONLY - NO API CALLS):', {
      activeTab,
      timestamp: new Date().toISOString(),
      note: "This component only displays data from FinanceContext - no webhook calls"
    });
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    console.log('📊 IncomeTabs: Tab changed to:', value, '(DISPLAY ONLY)');
    setActiveTab(value);
  };

  return (
    <div>
      <Tabs 
        defaultValue="stripe" 
        className="w-full"
        onValueChange={handleTabChange}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Fuentes de Ingresos</h2>
          <TabsList>
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
            <TabsTrigger value="zoho">Zoho</TabsTrigger>
            <TabsTrigger value="combined">Combinado</TabsTrigger>
          </TabsList>
        </div>

        {/* Stripe Income Tab */}
        <TabsContent value="stripe" className="p-0">
          <StripeIncomeTab />
        </TabsContent>

        {/* Zoho Income Tab */}
        <TabsContent value="zoho" className="p-0">
          <ZohoIncomeTab />
        </TabsContent>

        {/* Combined Financial Overview */}
        <TabsContent value="combined" className="p-0">
          <CombinedFinanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(IncomeTabs);
