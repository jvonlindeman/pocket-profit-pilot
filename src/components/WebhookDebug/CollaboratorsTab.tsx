
import React from 'react';
import { Calendar } from 'lucide-react';

interface Collaborator {
  vendor_name: string;
  date: string;
  total: number;
  status: string;
}

interface CollaboratorsTabProps {
  collaborators: Collaborator[];
}

export default function CollaboratorsTab({ collaborators }: CollaboratorsTabProps) {
  // Helper to format a date for display
  const formatDateForDisplay = (dateString: string) => {
    try {
      // Use the safer date parsing method
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('es-ES').format(date);
      } 
      return dateString; // Return original if parsing fails
    } catch (error) {
      return dateString;
    }
  };

  if (!Array.isArray(collaborators) || collaborators.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos de colaboradores disponibles
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
      <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
        <p className="text-sm text-blue-800 font-medium">Datos de Colaboradores</p>
        <p className="text-xs text-blue-700 mt-1 flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          Analizando fechas y datos de colaboradores
        </p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left border-b">Colaborador</th>
            <th className="p-2 text-left border-b">Fecha (Raw)</th>
            <th className="p-2 text-left border-b">Fecha (Formateada)</th>
            <th className="p-2 text-right border-b">Importe</th>
            <th className="p-2 text-center border-b">Estado</th>
          </tr>
        </thead>
        <tbody>
          {collaborators.map((collab, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-2 border-b font-medium">{collab.vendor_name || 'Sin nombre'}</td>
              <td className="p-2 border-b text-gray-600">
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                  {collab.date || 'Sin fecha'}
                </code>
              </td>
              <td className="p-2 border-b">
                {collab.date ? formatDateForDisplay(collab.date) : 'Sin fecha'}
              </td>
              <td className="p-2 border-b text-right">${collab.total?.toLocaleString() || '0'}</td>
              <td className="p-2 border-b text-center">
                <span className={`inline-block px-2 py-1 rounded text-xs ${
                  collab.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {collab.status || 'Pendiente'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
