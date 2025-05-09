
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WebhookRawData from './WebhookRawData';
import WebhookFormattedData from './WebhookFormattedData';

interface WebhookTabsProps {
  rawData: any;
  loading: boolean;
}

const WebhookTabs: React.FC<WebhookTabsProps> = ({ rawData, loading }) => {
  if (loading) {
    return null; // Tabs are not shown when loading
  }
  
  if (!rawData) {
    return (
      <div className="border rounded-md p-4 mt-2 bg-gray-50 text-center text-gray-500">
        No hay datos disponibles
      </div>
    );
  }
  
  return (
    <Tabs defaultValue="formatted" className="w-full">
      <TabsList className="grid grid-cols-2 w-[200px]">
        <TabsTrigger value="formatted">Formateado</TabsTrigger>
        <TabsTrigger value="raw">JSON Crudo</TabsTrigger>
      </TabsList>
      <TabsContent value="formatted" className="p-0">
        <WebhookFormattedData rawData={rawData} />
      </TabsContent>
      <TabsContent value="raw" className="p-0">
        <WebhookRawData rawData={rawData} />
      </TabsContent>
    </Tabs>
  );
};

export default WebhookTabs;
