
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WebhookFormattedData from './WebhookFormattedData';
import WebhookDataSummary from './WebhookDataSummary';
import WebhookRawData from './WebhookRawData';
import WebhookCollaboratorsData from './WebhookCollaboratorsData';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface WebhookDataTabsProps {
  rawData: any;
  isLoading?: boolean;
}

const WebhookDataTabs = ({ rawData, isLoading = false }: WebhookDataTabsProps) => {
  const isMobile = useIsMobile();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  return (
    <Tabs defaultValue="formatted" className="w-full">
      <TabsList className={`grid grid-cols-4 ${isMobile ? 'w-full text-xs' : 'w-[400px]'}`}>
        <TabsTrigger value="formatted" className={isMobile ? 'text-xs py-1 px-1' : ''}>Formateado</TabsTrigger>
        <TabsTrigger value="summary" className={isMobile ? 'text-xs py-1 px-1' : ''}>Resumen</TabsTrigger>
        <TabsTrigger value="collaborators" className={isMobile ? 'text-xs py-1 px-1' : ''}>Colaboradores</TabsTrigger>
        <TabsTrigger value="raw" className={isMobile ? 'text-xs py-1 px-1' : ''}>JSON</TabsTrigger>
      </TabsList>
      
      <TabsContent value="formatted" className="p-0">
        <WebhookFormattedData rawData={rawData} />
      </TabsContent>
      
      <TabsContent value="summary" className="p-0">
        <WebhookDataSummary rawData={rawData} />
      </TabsContent>
      
      <TabsContent value="collaborators" className="p-0">
        <WebhookCollaboratorsData rawData={rawData} />
      </TabsContent>
      
      <TabsContent value="raw" className="p-0">
        <WebhookRawData rawData={rawData} />
      </TabsContent>
    </Tabs>
  );
};

export default WebhookDataTabs;
