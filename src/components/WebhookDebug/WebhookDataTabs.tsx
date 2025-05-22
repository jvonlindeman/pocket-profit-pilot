
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WebhookFormattedData from './WebhookFormattedData';
import WebhookDataSummary from './WebhookDataSummary';
import WebhookRawData from './WebhookRawData';
import { useIsMobile } from '@/hooks/use-mobile';

interface WebhookDataTabsProps {
  rawData: any;
}

const WebhookDataTabs = ({ rawData }: WebhookDataTabsProps) => {
  const isMobile = useIsMobile();
  
  return (
    <Tabs defaultValue="formatted" className="w-full">
      <TabsList className={`grid grid-cols-3 ${isMobile ? 'w-full' : 'w-[300px]'}`}>
        <TabsTrigger value="formatted" className={isMobile ? 'text-xs py-1' : ''}>Formateado</TabsTrigger>
        <TabsTrigger value="summary" className={isMobile ? 'text-xs py-1' : ''}>Resumen</TabsTrigger>
        <TabsTrigger value="raw" className={isMobile ? 'text-xs py-1' : ''}>JSON Crudo</TabsTrigger>
      </TabsList>
      
      <TabsContent value="formatted" className="p-0">
        <WebhookFormattedData rawData={rawData} />
      </TabsContent>
      
      <TabsContent value="summary" className="p-0">
        <WebhookDataSummary rawData={rawData} />
      </TabsContent>
      
      <TabsContent value="raw" className="p-0">
        <WebhookRawData rawData={rawData} />
      </TabsContent>
    </Tabs>
  );
};

export default WebhookDataTabs;
