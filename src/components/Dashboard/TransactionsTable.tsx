
import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  flexRender, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  useReactTable, 
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel 
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  DatabaseIcon, 
  FilterIcon,
  RefreshCw 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Transaction } from '@/types/financial';
import { capitalize } from '@/lib/utils';

interface TransactionsTableProps {
  transactions: Transaction[];
  onClearCacheClick?: () => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, onClearCacheClick }) => {
  const [sorting, setSorting] = useState<SortingState>([{
    id: 'date',
    desc: true
  }]);
  
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const columns = useMemo(() => [
    {
      accessorKey: 'date',
      header: ({ column }) => {
        return (
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Fecha
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </div>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return <div>{format(date, 'dd/MM/yyyy', { locale: es })}</div>;
      }
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
    },
    {
      accessorKey: 'category',
      header: 'Categoría',
    },
    {
      accessorKey: 'source',
      header: 'Fuente',
      cell: ({ row }) => {
        const source = row.original.source;
        return (
          <Badge variant={source === 'Stripe' ? 'default' : 'outline'}>
            {source}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge 
            variant={type === 'income' ? 'success' : 'destructive'}
          >
            {type === 'income' ? 'Ingreso' : 'Gasto'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => {
        return (
          <div
            className="flex items-center justify-end cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Monto
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </div>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.original.amount.toString());
        const formatted = new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
        
        const type = row.original.type;
        
        return (
          <div className={`text-right font-medium ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
            {formatted}
          </div>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center">
              <DatabaseIcon className="mr-2 h-5 w-5" />
              Transacciones
              <Badge variant="outline" className="ml-2">
                {transactions.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Listado de ingresos y gastos en el período seleccionado
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border px-3 w-full md:w-auto">
              <FilterIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Filtrar descripciones..."
                value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                  table.getColumn('description')?.setFilterValue(event.target.value)
                }
                className="h-9 w-full md:w-[150px] lg:w-[250px] border-0 focus-visible:ring-0"
              />
            </div>
            {onClearCacheClick && (
              <Button variant="outline" size="sm" onClick={onClearCacheClick}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Refrescar datos
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No hay transacciones disponibles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination controls */}
        <div className="flex items-center justify-between py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            de {table.getFilteredRowModel().rows.length} transacciones
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsTable;
