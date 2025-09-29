import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMonthlySavings } from '@/hooks/useMonthlySavings';
import { SavingsFormDialog } from './SavingsFormDialog';
import { SavingsSummaryCard } from './SavingsSummaryCard';
import { SavingsHistory } from './SavingsHistory';
import { MonthlySavings } from '@/types/financial';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const MonthlySavingsManager: React.FC = () => {
  const {
    savings,
    loading,
    totalSavings,
    createSaving,
    updateSaving,
    deleteSaving,
  } = useMonthlySavings();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState<MonthlySavings | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [savingToDelete, setSavingToDelete] = useState<string | null>(null);

  const handleEdit = (saving: MonthlySavings) => {
    setEditingSaving(saving);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSavingToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (savingToDelete) {
      await deleteSaving(savingToDelete);
      setDeleteDialogOpen(false);
      setSavingToDelete(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Ahorros</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Ahorro
        </Button>
      </div>

      {!loading && <SavingsSummaryCard savings={savings} totalSavings={totalSavings} />}

      {!loading && (
        <SavingsHistory
          savings={savings}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <SavingsFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onSave={createSaving}
        editingSaving={editingSaving}
        onUpdate={updateSaving}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ahorro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro de ahorro será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
