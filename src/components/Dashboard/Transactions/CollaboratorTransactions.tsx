
import React from 'react';
import { Transaction } from '@/types/financial';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate, formatCurrency } from '@/lib/date-utils';

interface CollaboratorTransactionsProps {
  transactions: Transaction[];
}

const CollaboratorTransactions: React.FC<CollaboratorTransactionsProps> = ({ transactions }) => {
  // Extract collaborator name from description
  const getCollaboratorName = (description: string): string => {
    const match = description.match(/: (.+)$/);
    return match ? match[1] : 'Colaborador';
  };
  
  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Calculate total collaborator payments
  const totalPayments = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="bg-blue-50 p-4 rounded-md mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-800">Pagos a Colaboradores</h3>
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          Total: {formatCurrency(totalPayments)}
        </Badge>
      </div>
      
      <Table>
        <TableHeader className="bg-blue-100">
          <TableRow>
            <TableHead>Colaborador</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Fuente</TableHead>
            <TableHead className="text-right">Importe (USD)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                No hay pagos a colaboradores que mostrar
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => {
              const collaboratorName = getCollaboratorName(transaction.description);
              const initials = getInitials(collaboratorName);
              
              return (
                <TableRow key={transaction.id} className="hover:bg-blue-100/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 bg-blue-200 text-blue-800">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span>{collaboratorName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.source}</TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    - {formatCurrency(transaction.amount)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CollaboratorTransactions;
