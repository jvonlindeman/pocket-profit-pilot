
import React from 'react';

interface RawDataTabProps {
  rawData: any;
}

export default function RawDataTab({ rawData }: RawDataTabProps) {
  if (!rawData) {
    return <div className="text-center py-8 text-gray-500">No hay datos disponibles</div>;
  }

  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
      <pre className="text-xs whitespace-pre-wrap break-words">
        {JSON.stringify(rawData, null, 2)}
      </pre>
    </div>
  );
}
