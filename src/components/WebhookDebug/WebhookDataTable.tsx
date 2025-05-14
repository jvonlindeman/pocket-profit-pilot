
import React from 'react';

interface WebhookDataTableProps {
  rawData: any;
}

const WebhookDataTable: React.FC<WebhookDataTableProps> = ({ rawData }) => {
  // Lista de proveedores que deben ser excluidos
  const excludedVendors = ["Johan von Lindeman", "DFC Panama"];

  // Helper para determinar si un item es un array de ingresos
  const isIncomeArray = (item: any): boolean => {
    return Array.isArray(item) && 
           item.length > 0 && 
           typeof item[0] === 'object' && 
           'customer_name' in item[0] && 
           'amount' in item[0];
  };

  // Helper para determinar si un item es un array de colaboradores
  const isCollaboratorArray = (item: any): boolean => {
    return Array.isArray(item) && 
           item.length > 0 && 
           typeof item[0] === 'object' && 
           'vendor_name' in item[0] && 
           'total' in item[0];
  };

  // Función para obtener el color de fondo según la categoría
  const getCategoryBgColor = (category: string): string => {
    const colors: Record<string, string> = {
      'software': 'bg-purple-50',
      'herramientas': 'bg-amber-50',
      'servidores': 'bg-cyan-50',
      'personal': 'bg-emerald-50',
      'marketing': 'bg-rose-50',
      'contabilidad': 'bg-blue-50',
      'estacionamiento': 'bg-slate-50',
      'dominio': 'bg-indigo-50',
      'itbms': 'bg-orange-50',
      'comisiones': 'bg-red-50',
      'ads': 'bg-pink-50',
      'publicidad': 'bg-pink-50',
      'colaborador': 'bg-teal-50',
      'default': 'bg-gray-50',
    };

    // Buscar coincidencias parciales en las claves
    const key = Object.keys(colors).find(k => 
      category.toLowerCase().includes(k)
    ) || 'default';
    
    return colors[key];
  };

  // Función para obtener el color del texto según la categoría
  const getCategoryTextColor = (category: string): string => {
    const colors: Record<string, string> = {
      'software': 'text-purple-700',
      'herramientas': 'text-amber-700',
      'servidores': 'text-cyan-700',
      'personal': 'text-emerald-700',
      'marketing': 'text-rose-700',
      'contabilidad': 'text-blue-700',
      'estacionamiento': 'text-slate-700',
      'dominio': 'text-indigo-700',
      'itbms': 'text-orange-700',
      'comisiones': 'text-red-700',
      'ads': 'text-pink-700',
      'publicidad': 'text-pink-700',
      'colaborador': 'text-teal-700',
      'default': 'text-gray-700',
    };

    // Buscar coincidencias parciales en las claves
    const key = Object.keys(colors).find(k => 
      category.toLowerCase().includes(k)
    ) || 'default';
    
    return colors[key];
  };

  // Función para formatear moneda
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return amount;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numAmount);
  };
  
  // Filtrar colaboradores para excluir proveedores específicos
  const filterCollaborators = (collaborators: any[]) => {
    if (!Array.isArray(collaborators)) return [];
    
    return collaborators.filter(collab => !excludedVendors.includes(collab.vendor_name));
  };

  if (!rawData) return null;

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left border-b">Elemento #</th>
          <th className="p-2 text-left border-b">Tipo</th>
          <th className="p-2 text-left border-b">Datos</th>
        </tr>
      </thead>
      <tbody>
        {Array.isArray(rawData) ? (
          rawData.map((item, index) => {
            // Filtrar colaboradores si el item es un array de colaboradores
            const displayData = isCollaboratorArray(item) ? filterCollaborators(item) : item;
            
            return (
              <tr key={index} className={isIncomeArray(item) ? "bg-green-50" : isCollaboratorArray(item) ? "bg-blue-50" : ""}>
                <td className="p-2 border-b">{index + 1}</td>
                <td className="p-2 border-b font-medium">
                  {isIncomeArray(item) 
                    ? `Array de Ingresos (${Array.isArray(item) ? item.length : 0} elementos)` 
                    : isCollaboratorArray(item)
                      ? `Array de Colaboradores (${Array.isArray(displayData) ? displayData.length : 0} elementos)`
                      : item && typeof item === 'object' && 'vendor_name' in item 
                        ? `Gasto (${item.vendor_name || 'Sin proveedor'})` 
                        : Array.isArray(item) && item.length > 0 && item[0].vendor_name
                          ? `Array de Facturas (${item.length} elementos)`
                          : 'Desconocido'}
                </td>
                <td className="p-2 border-b">
                  {isIncomeArray(item) ? (
                    <div>
                      <p className="font-medium mb-1 text-green-700">Ejemplos de ingresos:</p>
                      <ul className="list-disc pl-5">
                        {Array.isArray(item) && item.slice(0, 3).map((income, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="text-green-600 font-medium">{income.customer_name}:</span> {formatCurrency(income.amount)}
                            {income.date ? ` (${income.date})` : ''}
                          </li>
                        ))}
                        {Array.isArray(item) && item.length > 3 && (
                          <li className="text-xs text-gray-500">
                            ...y {item.length - 3} más
                          </li>
                        )}
                      </ul>
                    </div>
                  ) : isCollaboratorArray(item) ? (
                    <div>
                      <p className="font-medium mb-1 text-blue-700">Ejemplos de colaboradores:</p>
                      <ul className="list-disc pl-5">
                        {filterCollaborators(item).slice(0, 3).map((collab, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="text-blue-600 font-medium">{collab.vendor_name}:</span> {formatCurrency(collab.total)}
                            {collab.date ? ` (${collab.date})` : ''}
                          </li>
                        ))}
                        {filterCollaborators(item).length > 3 && (
                          <li className="text-xs text-gray-500">
                            ...y {filterCollaborators(item).length - 3} más
                          </li>
                        )}
                      </ul>
                    </div>
                  ) : (
                    <div>
                      {item && typeof item === 'object' ? (
                        <ul className="list-disc pl-5">
                          {Object.entries(item).map(([key, value]) => {
                            // Determina si es una categoría y aplica colores
                            const isCategory = key.toLowerCase() === 'category' || key.toLowerCase() === 'expense_category';
                            const categoryValue = isCategory ? String(value) : '';
                            
                            return (
                              <li key={key} className={`text-sm ${isCategory ? getCategoryTextColor(categoryValue) : ''}`}>
                                <span className="font-medium">{key}:</span>{' '}
                                {isCategory ? (
                                  <span className={`px-2 py-0.5 rounded ${getCategoryBgColor(categoryValue)}`}>
                                    {String(value)}
                                  </span>
                                ) : (
                                  key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') ? 
                                  formatCurrency(value as any) : 
                                  String(value)
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : Array.isArray(item) ? (
                        <div>
                          <p className="font-medium mb-1 text-amber-700">Ejemplos de facturas:</p>
                          <ul className="list-disc pl-5">
                            {item.slice(0, 3).map((bill, idx) => {
                              // Si hay una categoría, aplicamos colores
                              const category = bill.expense_category || bill.category || '';
                              return (
                                <li key={idx} className="text-sm">
                                  {bill.vendor_name ? (
                                    <>
                                      <span className="text-amber-600 font-medium">{bill.vendor_name}:</span> {formatCurrency(bill.total)}
                                      {category && (
                                        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${getCategoryBgColor(category)} ${getCategoryTextColor(category)}`}>
                                          {category}
                                        </span>
                                      )}
                                      {bill.date ? ` (${bill.date})` : ''}
                                    </>
                                  ) : JSON.stringify(bill)}
                                </li>
                              );
                            })}
                            {item.length > 3 && (
                              <li className="text-xs text-gray-500">
                                ...y {item.length - 3} más
                              </li>
                            )}
                          </ul>
                        </div>
                      ) : (
                        String(item)
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })
        ) : typeof rawData === 'object' ? (
          <tr>
            <td colSpan={3} className="p-2 border-b">
              <ul className="list-disc pl-5">
                {Object.entries(rawData || {}).map(([key, value]) => {
                  // Determina si es una categoría y aplica colores
                  const isCategory = key.toLowerCase() === 'category' || key.toLowerCase() === 'expense_category';
                  const categoryValue = isCategory ? String(value) : '';
                  
                  return (
                    <li key={key} className={`text-sm ${isCategory ? getCategoryTextColor(categoryValue) : ''}`}>
                      <span className="font-medium">{key}:</span>{' '}
                      {isCategory ? (
                        <span className={`px-2 py-0.5 rounded ${getCategoryBgColor(categoryValue)}`}>
                          {String(value)}
                        </span>
                      ) : (
                        key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') ? 
                        typeof value === 'number' ? formatCurrency(value) : 
                        typeof value === 'object' ? JSON.stringify(value) : String(value) : 
                        typeof value === 'object' ? JSON.stringify(value) : String(value)
                      )}
                    </li>
                  );
                })}
              </ul>
            </td>
          </tr>
        ) : (
          <tr>
            <td colSpan={3} className="p-2 border-b">{String(rawData)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default WebhookDataTable;
