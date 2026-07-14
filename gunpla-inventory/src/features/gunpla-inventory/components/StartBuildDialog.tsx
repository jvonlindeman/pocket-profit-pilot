import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { GunplaItem } from "../types";
import { BUILD_STAGES, stagesDone, stagesSkipped } from "../lib/inventory";

interface StartBuildDialogProps {
  /** Kit about to be started; null = dialog closed. */
  item: GunplaItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (item: GunplaItem, stages: string[], skipped: string[]) => void;
}

const doneHint = (n: number) => (n === 1 ? "1 hecha" : `${n} hechas`);

/**
 * Asks where the build actually is before putting a kit on the bench: resume
 * its saved checklist, start clean, or jump to a stage (everything before it
 * is marked done). This is how finished kits get reopened without losing
 * their checklist.
 */
const StartBuildDialog = ({
  item,
  onOpenChange,
  onConfirm,
}: StartBuildDialogProps) => {
  const done = stagesDone(item?.stages);
  const applicable = BUILD_STAGES.length - stagesSkipped(item?.skippedStages);
  const hasProgress =
    (item?.stages?.length ?? 0) > 0 || (item?.skippedStages?.length ?? 0) > 0;

  const confirm = (stages: string[], skipped: string[]) => {
    if (!item) return;
    onConfirm(item, stages, skipped);
  };

  const rowClass =
    "flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted";

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿En qué etapa vas con este kit?</DialogTitle>
          <DialogDescription>
            {item?.name} ({item?.code}) — las etapas anteriores a la que elijas
            se marcan como hechas.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto rounded-md border">
          {hasProgress && (
            <button
              type="button"
              onClick={() =>
                confirm(item?.stages ?? [], item?.skippedStages ?? [])
              }
              className={rowClass}
            >
              <span className="font-medium">Continuar donde quedó</span>
              <Badge variant="secondary" className="shrink-0">
                {done}/{applicable} hechas
              </Badge>
            </button>
          )}
          <button
            type="button"
            onClick={() => confirm([], [])}
            className={rowClass}
          >
            <span className="font-medium">Desde cero</span>
          </button>
          {BUILD_STAGES.map((stage, i) => (
            <button
              key={stage.key}
              type="button"
              onClick={() =>
                confirm(
                  BUILD_STAGES.slice(0, i).map((s) => s.key),
                  []
                )
              }
              className={rowClass}
            >
              <span className="min-w-0 truncate">
                Voy por: <span className="font-medium">{stage.label}</span>
              </span>
              {i > 0 && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {doneHint(i)}
                </span>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StartBuildDialog;
